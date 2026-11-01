import { MoreVertical } from 'lucide-react'
import { Link } from 'react-router-dom'

export type VideoItem = { id: string; title: string; channel: string; views: string; age: string; duration: string; image: string; avatar: string }

export function VideoCard({ video }: { video: VideoItem }) {
  return <article className="video-card"><Link className="thumbnail-link" to={`/watch/${video.id}`} aria-label={`Watch ${video.title}`}><img className="thumbnail" src={video.image} alt="" loading="lazy"/><span className="duration">{video.duration}</span></Link><div className="video-meta"><img className="channel-avatar" src={video.avatar} alt="" loading="lazy"/><div className="video-copy"><Link to={`/watch/${video.id}`} className="video-title">{video.title}</Link><Link to={`/channel/${encodeURIComponent(video.channel.toLowerCase().replaceAll(' ', '-'))}`} className="channel-name">{video.channel}</Link><p className="video-stats">{video.views} views · {video.age}</p></div><button className="card-menu" aria-label="More options"><MoreVertical size={19}/></button></div></article>
}
