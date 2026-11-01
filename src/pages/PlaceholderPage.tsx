import { useLocation, useParams } from 'react-router-dom'

export function PlaceholderPage() {
  const { section, videoId, handle } = useParams()
  const location = useLocation()
  const title = videoId ? 'Video player' : handle ? 'Channel' : section ? section.replaceAll('-', ' ') : location.pathname === '/search' ? 'Search results' : 'Page'
  return <section className="placeholder-page"><p className="eyebrow">YT WEB</p><h1>{title}</h1><p>This page is part of the platform foundation. Its data and actions will be connected to Supabase in the next implementation phases.</p></section>
}
