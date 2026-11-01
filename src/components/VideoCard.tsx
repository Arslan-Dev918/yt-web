import { MoreVertical } from 'lucide-react'
import { Link } from 'react-router-dom'

export type VideoItem = { id: string; title: string; channel: string; channelHandle: string; views: string; age: string; duration: string; image: string; avatar: string }

export function VideoCard({ video }: { video: VideoItem }) {
  return <article className="video-card"><Link className="thumbnail-link" to={`/watch/${video.id}`} aria-label={`Watch ${video.title}`}>{video.image && <img className="thumbnail" src={video.image} alt="" loading="lazy"/>}{video.duration && <span className="duration">{video.duration}</span>}</Link><div className="video-meta">{video.avatar ? <img className="channel-avatar" src={video.avatar} alt="" loading="lazy"/> : <span className="channel-avatar channel-avatar-fallback" aria-hidden="true">{video.channel.slice(0, 1).toUpperCase()}</span>}<div className="video-copy"><Link to={`/watch/${video.id}`} className="video-title">{video.title}</Link>{video.channelHandle ? <Link to={`/channel/${encodeURIComponent(video.channelHandle)}`} className="channel-name">{video.channel}</Link> : <span className="channel-name">{video.channel}</span>}<p className="video-stats">{video.views} views · {video.age}</p></div><span className="card-menu" aria-hidden="true"><MoreVertical size={19}/></span></div></article>
}

