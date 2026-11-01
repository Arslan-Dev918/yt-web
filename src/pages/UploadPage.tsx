import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

const MAX_VIDEO_BYTES = 100 * 1024 * 1024
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024

async function detectVideoType(file: File): Promise<string | null> {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const ascii = (start: number, length: number) => String.fromCharCode(...header.slice(start, start + length))
  if (ascii(4, 4) === 'ftyp') {
    const brand = ascii(8, 4)
    return brand === 'qt  ' ? 'video/quicktime' : 'video/mp4'
  }
  if (header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3) return 'video/webm'
  return null
}

async function detectImageType(file: File): Promise<string | null> {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const ascii = (start: number, length: number) => String.fromCharCode(...header.slice(start, start + length))
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return 'image/jpeg'
  if (header.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10') return 'image/png'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'image/webp'
  if (ascii(4, 4) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 4))) return 'image/avif'
  return null
}

function readDuration(file: File) {
  return new Promise<number | null>(resolve => {
    const objectUrl = URL.createObjectURL(file)
    const element = document.createElement('video')
    const finish = (value: number | null) => { URL.revokeObjectURL(objectUrl); resolve(value) }
    element.preload = 'metadata'
    element.onloadedmetadata = () => finish(Number.isFinite(element.duration) ? Math.round(element.duration) : null)
    element.onerror = () => finish(null)
    element.src = objectUrl
  })
}

export function UploadPage() {
  const { user, loading, configured } = useAuth()
  const navigate = useNavigate()
  const [channel, setChannel] = useState<{ id: string; handle: string } | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !supabase) return
    let active = true
    void supabase.from('channels').select('id,handle').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      if (active) setChannel(data)
    })
    return () => { active = false }
  }, [user])

  if (loading) return <section className="upload-page"><p>Loading…</p></section>
  if (!user) return <Navigate to="/auth" replace />
  if (!configured || !supabase) return <section className="upload-page"><h1>Uploads unavailable</h1><p>Supabase is not configured for this deployment.</p></section>
  if (!channel) return <section className="upload-page"><h1>Create a channel first</h1><p>You need a VisTube channel before you can upload videos.</p><Link className="form-primary" to="/account">Create a channel</Link></section>

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !supabase || !channel || !videoFile) return
    setError(''); setMessage('')
    if (title.trim().length < 2 || title.trim().length > 120) { setError('Title must be between 2 and 120 characters.'); return }
    if (description.length > 5000) { setError('Description must be 5,000 characters or less.'); return }
    if (videoFile.size <= 0 || videoFile.size > MAX_VIDEO_BYTES) { setError('Choose a video file up to 100 MB.'); return }
    if (thumbnailFile && (thumbnailFile.size <= 0 || thumbnailFile.size > MAX_THUMBNAIL_BYTES)) { setError('Thumbnail must be 5 MB or smaller.'); return }
    const videoType = await detectVideoType(videoFile)
    if (!videoType) { setError('Choose a valid MP4, MOV, or WebM video file.'); return }
    const thumbnailType = thumbnailFile ? await detectImageType(thumbnailFile) : null
    if (thumbnailFile && !thumbnailType) { setError('Choose a valid JPEG, PNG, WebP, or AVIF thumbnail.'); return }

    setBusy(true); setMessage('Reading video details…')
    const duration = await readDuration(videoFile)
    const videoId = crypto.randomUUID()
    const safeName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'video'
    const videoPath = channel.id + '/' + videoId + '/' + safeName
    const thumbnailPath = thumbnailFile ? channel.id + '/' + videoId + '/thumbnail.' + (thumbnailType === 'image/jpeg' ? 'jpg' : thumbnailType?.split('/')[1]) : null
    let uploadedVideo = false
    let uploadedThumbnail = false
    try {
      setMessage('Uploading video…')
      const { error: uploadError } = await supabase.storage.from('videos').upload(videoPath, videoFile, { contentType: videoType, upsert: false, cacheControl: '3600' })
      if (uploadError) throw uploadError
      uploadedVideo = true
      if (thumbnailFile && thumbnailPath && thumbnailType) {
        setMessage('Uploading thumbnail…')
        const { error: thumbError } = await supabase.storage.from('thumbnails').upload(thumbnailPath, thumbnailFile, { contentType: thumbnailType, upsert: false, cacheControl: '3600' })
        if (thumbError) throw thumbError
        uploadedThumbnail = true
      }
      setMessage('Saving video details…')
      const { error: insertError } = await supabase.from('videos').insert({
        id: videoId, channel_id: channel.id, title: title.trim(), description: description.trim(),
        video_url: videoPath, thumbnail_url: thumbnailPath, visibility, duration_seconds: duration,
      })
      if (insertError) throw insertError
      navigate('/watch/' + videoId)
    } catch {
      if (uploadedVideo) await supabase.storage.from('videos').remove([videoPath])
      if (uploadedThumbnail && thumbnailPath) await supabase.storage.from('thumbnails').remove([thumbnailPath])
      setError('Upload failed. Check your connection, file type, and storage setup, then try again.')
    } finally {
      setBusy(false); setMessage('')
    }
  }

  return <section className="upload-page">
    <header className="account-page-header"><p className="eyebrow">CREATOR STUDIO</p><h1>Upload a video</h1><p>Publishing to @{channel.handle}</p></header>
    <form className="settings-card" onSubmit={publish}>
      <label>Video file<input required type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" onChange={event => setVideoFile(event.target.files?.[0] ?? null)}/><small>MP4, MOV, or WebM · up to 100 MB.</small></label>
      <label>Title<input required minLength={2} maxLength={120} value={title} onChange={event => setTitle(event.target.value)}/></label>
      <label>Description<textarea maxLength={5000} rows={5} value={description} onChange={event => setDescription(event.target.value)}/></label>
      <label>Thumbnail<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => setThumbnailFile(event.target.files?.[0] ?? null)}/><small>Optional · JPEG, PNG, WebP, or AVIF · up to 5 MB.</small></label>
      <label>Visibility<select value={visibility} onChange={event => setVisibility(event.target.value as 'public' | 'unlisted' | 'private')}><option value="public">Public — shown on VisTube</option><option value="unlisted">Unlisted — anyone with the link</option><option value="private">Private — only you</option></select></label>
      {error && <p className="form-feedback form-error" role="alert">{error}</p>}
      {message && <p className="form-feedback form-success" role="status">{message}</p>}
      <button className="form-primary" disabled={busy || !videoFile}>{busy ? 'Uploading…' : 'Publish video'}</button>
    </form>
  </section>
}

