import { useState } from 'react'
import { VideoCard, type VideoItem } from '../components/VideoCard'

const categories = ['All', 'Gaming', 'Music', 'Education', 'Technology', 'Entertainment', 'Sports', 'News']
const videos: VideoItem[] = [
  { id:'coast', title:'A quiet morning on the coast | Slow travel film', channel:'Northbound', views:'128K', age:'2 days ago', duration:'18:42', image:'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=960&q=80', avatar:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
  { id:'studio', title:'Building a small creative studio from scratch', channel:'Maya Makes', views:'42K', age:'1 week ago', duration:'24:16', image:'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=960&q=80', avatar:'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=100&q=80' },
  { id:'mountains', title:'The long way home — hiking the Dolomites', channel:'Field Notes', views:'316K', age:'3 weeks ago', duration:'32:08', image:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=960&q=80', avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' },
  { id:'music', title:'Live session in a room full of sunlight', channel:'Soft Focus', views:'89K', age:'5 days ago', duration:'12:55', image:'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=960&q=80', avatar:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80' },
  { id:'food', title:'Three simple dinners for a busy week', channel:'Good Table', views:'203K', age:'1 month ago', duration:'14:27', image:'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=960&q=80', avatar:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80' },
  { id:'design', title:'Why old interfaces still feel so good', channel:'Pixel Practice', views:'57K', age:'4 days ago', duration:'20:03', image:'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=960&q=80', avatar:'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=100&q=80' },
  { id:'city', title:'A day walking every street in the old city', channel:'Ari Outside', views:'741K', age:'2 months ago', duration:'27:39', image:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=960&q=80', avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
  { id:'desk', title:'A calmer way to organize your digital life', channel:'Clear Space', views:'61K', age:'6 days ago', duration:'16:11', image:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=960&q=80', avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80' },
]

export function HomePage() {
  const [selected, setSelected] = useState('All')
  return <div className="home-page"><div className="category-strip" aria-label="Video categories">{categories.map(category => <button key={category} className={`category-chip ${selected === category ? 'selected' : ''}`} onClick={() => setSelected(category)}>{category}</button>)}</div><section className="video-grid" aria-label="Recommended videos">{videos.map(video => <VideoCard key={video.id} video={video}/>)}</section></div>
}
