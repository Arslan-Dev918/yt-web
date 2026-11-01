import { NavLink } from 'react-router-dom'
import { Home, Compass, PlaySquare, Clock3, ThumbsUp, Bookmark, ListVideo, Video, UserRoundPlus, Radio, Settings } from 'lucide-react'

const links = [
  { title: 'Home', href: '/', icon: Home },
  { title: 'Explore', href: '/feed/explore', icon: Compass },
  { title: 'Subscriptions', href: '/feed/subscriptions', icon: PlaySquare },
]
const library = [
  { title: 'History', href: '/feed/history', icon: Clock3 },
  { title: 'Your videos', href: '/feed/your-videos', icon: Video },
  { title: 'Liked videos', href: '/feed/liked', icon: ThumbsUp },
  { title: 'Saved videos', href: '/feed/saved', icon: Bookmark },
  { title: 'Playlists', href: '/feed/playlists', icon: ListVideo },
]

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  return <><div className={`sidebar-backdrop ${open ? 'visible' : ''}`} onClick={onNavigate}/><aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
    <nav aria-label="Main navigation"><div className="nav-group">{links.map(({title, href, icon: Icon}) => <NavLink key={title} to={href} onClick={onNavigate} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={21}/><span>{title}</span></NavLink>)}</div>
      <div className="nav-divider"/><section className="nav-section"><h2>You</h2>{library.map(({title, href, icon: Icon}) => <NavLink key={title} to={href} onClick={onNavigate} className="nav-link"><Icon size={20}/><span>{title}</span></NavLink>)}</section>
      <div className="nav-divider"/><section className="nav-section"><h2>Creator</h2><NavLink to="/feed/channel" onClick={onNavigate} className="nav-link"><UserRoundPlus size={20}/><span>Create a channel</span></NavLink><NavLink to="/feed/upload" onClick={onNavigate} className="nav-link"><Radio size={20}/><span>Upload video</span></NavLink></section>
      <div className="sidebar-footer"><Settings size={16}/> Settings</div>
    </nav>
  </aside></>
}
