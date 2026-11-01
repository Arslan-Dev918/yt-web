import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { VideoCard } from '../components/VideoCard'
import { loadPublicVideos, type VideoCardData } from '../lib/videos'

type Channel = { id: string; owner_id: string; name: string; handle: string; description: string; avatar_url: string | null; banner_url: string | null; created_at: string }

export function ChannelPage() {
  const { handle = '' } = useParams()
  const { user } = useAuth()
  const [channel, setChannel] = useState<Channel | null>(null)
  const [videos, setVideos] = useState<VideoCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) { setLoading(false); setError('VisTube is not connected to Supabase.'); return }
    let active = true
    void supabase.from('channels').select('id,owner_id,name,handle,description,avatar_url,banner_url,created_at').eq('handle', handle.toLowerCase()).maybeSingle()
      .then(async ({ data, error: queryError }) => {
        if (!active) return
        if (queryError) setError('This channel could not be loaded.')
        else {
          setChannel(data)
          if (data) {
            try {
              const rows = await loadPublicVideos(data.id)
              if (active) setVideos(rows)
            } catch { if (active) setError('Channel videos could not be loaded.') }
          }
        }
        if (!active) return
        setLoading(false)
      })
    return () => { active = false }
  }, [handle])

  if (loading) return <section className="channel-page"><p>Loading channel…</p></section>
  if (error) return <section className="channel-page"><h1>Channel unavailable</h1><p>{error}</p></section>
  if (!channel) return <section className="channel-page"><h1>Channel not found</h1><p>This channel may have been removed or the address may be incorrect.</p><Link to="/">Back to home</Link></section>

  return <section className="channel-page">
    <div className="channel-banner" style={channel.banner_url ? { backgroundImage: `linear-gradient(#0002,#0002),url("${channel.banner_url.replaceAll('"', '')}")` } : undefined}/>
    <header className="channel-heading">
      {channel.avatar_url ? <img className="channel-profile-avatar" src={channel.avatar_url} alt=""/> : <div className="channel-profile-avatar channel-avatar-fallback" aria-hidden="true">{channel.name.slice(0, 1).toUpperCase()}</div>}
      <div className="channel-heading-copy"><h1>{channel.name}</h1><p>@{channel.handle}</p><p>{channel.description || 'Welcome to my channel.'}</p></div>
      {user?.id === channel.owner_id && <Link className="form-secondary" to="/account">Edit channel</Link>}
    </header>
    <div className="channel-tabs"><span>Videos</span><span>About</span></div>
    {videos.length ? <section className="video-grid channel-video-grid" aria-label="Channel videos">{videos.map(video => <VideoCard key={video.id} video={video}/>)}</section>
      : <div className="channel-empty"><h2>No videos yet</h2><p>Videos published to this channel will appear here.</p></div>}
  </section>
}

