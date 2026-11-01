import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { VideoCard } from '../components/VideoCard'
import { loadPublicVideos, type VideoCardData } from '../lib/videos'
import { isSupabaseConfigured } from '../lib/supabase'

const categories = ['All', 'Gaming', 'Music', 'Education', 'Technology', 'Entertainment', 'Sports', 'News']

export function HomePage() {
  const [selected, setSelected] = useState('All')
  const [videos, setVideos] = useState<VideoCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void loadPublicVideos().then(rows => {
      if (active) setVideos(rows)
    }).catch(() => {
      if (active) setError('Videos could not be loaded. Check your connection and try again.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return <div className="home-page"><div className="category-strip" aria-label="Video categories">{categories.map(category => <button key={category} className={'category-chip ' + (selected === category ? 'selected' : '')} onClick={() => setSelected(category)}>{category}</button>)}</div>
    {loading ? <div className="video-grid" aria-label="Loading videos">{Array.from({ length: 6 }, (_, index) => <div className="video-skeleton" key={index}/>)}</div>
      : error ? <section className="empty-feed"><h1>We couldn’t load videos</h1><p>{error}</p></section>
        : videos.length ? <section className="video-grid" aria-label="Recently uploaded videos">{videos.map(video => <VideoCard key={video.id} video={video}/>)}</section>
          : <section className="empty-feed"><h1>No videos yet</h1><p>When creators publish videos, they’ll show up here.</p>{isSupabaseConfigured && <Link className="form-secondary" to="/feed/upload">Upload your first video</Link>}</section>}
  </div>
}

