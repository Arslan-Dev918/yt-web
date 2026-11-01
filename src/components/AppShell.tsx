import { useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Search, Video, Bell, CircleUserRound, Mic, Plus } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children?: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-area"><button className="icon-button menu-button" aria-label="Toggle navigation" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={22} /></button><a href="/" className="brand"><span className="brand-mark"><Video size={18} fill="currentColor" /></span><span>yt<span className="brand-web">web</span></span></a></div>
      <form className="search-form" onSubmit={e => { e.preventDefault(); if (query.trim()) window.location.href = `/search?q=${encodeURIComponent(query.trim())}` }}><div className="search-field"><Search size={19} className="search-leading"/><input aria-label="Search" placeholder="Search videos" value={query} onChange={e => setQuery(e.target.value)} /><button aria-label="Search" className="search-submit"><Search size={20}/></button></div><button type="button" className="icon-button voice-search" aria-label="Voice search"><Mic size={19}/></button></form>
      <div className="top-actions"><button className="create-button"><Plus size={19}/><span>Create</span></button><button className="icon-button notification-button" aria-label="Notifications"><Bell size={20}/></button><button className="avatar avatar-user" aria-label="Account"><CircleUserRound size={23}/></button></div>
    </header>
    <div className="body-layout"><Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)}/><main className="main-content">{children ?? <Outlet/>}</main></div>
  </div>
}
