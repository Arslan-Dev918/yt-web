import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { formatAge } from '../lib/videos'

type WatchVideo = {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string | null
  visibility: 'public' | 'unlisted' | 'private'
  view_count: number
  created_at: string
  channel: { id: string; owner_id: string; name: string; handle: string; avatar_url: string | null } | null
}

export function WatchPage() {
  const { videoId = '' } = useParams()
  const { user } = useAuth()
  const [video, setVideo] = useState<WatchVideo | null>(null)
  const [playUrl, setPlayUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) { setLoading(false); setError('VisTube is not connected to Supabase.'); return }
    let active = true
    void (async () => {
      try {
        const { data, error: queryError } = await supabase!.from('videos')
          .select('id,title,description,video_url,thumbnail_url,visibility,view_count,created_at,channel:channels(id,owner_id,name,handle,avatar_url)')
          .eq('id', videoId).maybeSingle()
        if (!active) return
        if (queryError || !data) {
          setError('This video is unavailable. It may have been removed or is private.')
          setLoading(false); return
        }
        const row = data as unknown as WatchVideo
        const [{ data: playback, error: playbackError }, thumbnail] = await Promise.all([
          supabase!.storage.from('videos').createSignedUrl(row.video_url, 3600),
          row.thumbnail_url ? supabase!.storage.from('thumbnails').createSignedUrl(row.thumbnail_url, 3600) : Promise.resolve({ data: null, error: null }),
        ])
        if (!active) return
        if (playbackError || !playback?.signedUrl) setError('Playback could not be authorized. Check the video storage policies and try again.')
        else {
          setVideo(row)
          setPlayUrl(playback.signedUrl)
          setThumbnailUrl(thumbnail.data?.signedUrl ?? '')
        }
        setLoading(false)
      } catch {
        if (active) { setError('Video details could not be loaded.'); setLoading(false) }
      }
    })()
    return () => { active = false }
  }, [videoId])

  if (loading) return <section className="watch-page"><div className="watch-player-skeleton"/><p>Loading video…</p></section>
  if (error || !video) return <section className="empty-feed watch-empty"><h1>Video unavailable</h1><p>{error || 'This video could not be found.'}</p><Link className="form-secondary" to="/">Back to home</Link></section>

  const channel = Array.isArray(video.channel) ? video.channel[0] : video.channel
  return <section className="watch-page">
    <video className="watch-player" controls playsInline preload="metadata" poster={thumbnailUrl || undefined} src={playUrl}>Your browser does not support video playback.</video>
    <h1 className="watch-title">{video.title}</h1>
    <div className="watch-channel-row">
      <div className="watch-channel-identity">{channel?.avatar_url ? <img src={channel.avatar_url} alt=""/> : <span className="channel-avatar channel-avatar-fallback">{channel?.name.slice(0, 1).toUpperCase() ?? 'V'}</span>}<div>{channel ? <Link to={'/channel/' + encodeURIComponent(channel.handle)}>{channel.name}</Link> : <span>VisTube creator</span>}<small>{Number(video.view_count).toLocaleString()} views · {formatAge(video.created_at)}</small></div></div>
      {user?.id === channel?.owner_id && <Link className="form-secondary" to="/feed/upload">Upload video</Link>}
    </div>
    {video.description && <div className="watch-description">{video.description}</div>}
  </section>
}

