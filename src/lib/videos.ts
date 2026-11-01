import { supabase } from './supabase'

export type VideoCardData = {
  id: string
  title: string
  channel: string
  channelHandle: string
  views: string
  age: string
  duration: string
  image: string
  avatar: string
}

type VideoRow = {
  id: string
  title: string
  video_url: string
  thumbnail_url: string | null
  duration_seconds: number | null
  view_count: number
  created_at: string
  channel: { name: string; handle: string; avatar_url: string | null } | { name: string; handle: string; avatar_url: string | null }[] | null
}

export function formatDuration(seconds: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0')
  return hours ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainder}` : `${minutes}:${remainder}`
}

export function formatAge(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime())
  const days = Math.floor(elapsed / 86_400_000)
  if (days >= 365) return `${Math.floor(days / 365)}y ago`
  if (days >= 30) return `${Math.floor(days / 30)}mo ago`
  if (days >= 1) return `${days}d ago`
  const hours = Math.floor(elapsed / 3_600_000)
  if (hours) return `${hours}h ago`
  const minutes = Math.floor(elapsed / 60_000)
  return minutes ? `${minutes}m ago` : 'just now'
}

export async function loadPublicVideos(channelId?: string, limit = 24): Promise<VideoCardData[]> {
  if (!supabase) throw new Error('Supabase is not configured.')
  let request = supabase.from('videos')
    .select('id,title,video_url,thumbnail_url,duration_seconds,view_count,created_at,channel:channels(id,name,handle,avatar_url)')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (channelId) request = request.eq('channel_id', channelId)
  const { data, error } = await request
  if (error) throw error
  const rows = (data ?? []) as unknown as VideoRow[]
  return Promise.all(rows.map(async row => {
    const channel = Array.isArray(row.channel) ? row.channel[0] : row.channel
    let image = ''
    if (row.thumbnail_url) {
      const { data: signed, error: signedError } = await supabase!.storage.from('thumbnails').createSignedUrl(row.thumbnail_url, 3600)
      if (!signedError) image = signed.signedUrl
    }
    return {
      id: row.id,
      title: row.title,
      channel: channel?.name ?? 'VisTube creator',
      channelHandle: channel?.handle ?? '',
      views: Number(row.view_count).toLocaleString(),
      age: formatAge(row.created_at),
      duration: formatDuration(row.duration_seconds),
      image,
      avatar: channel?.avatar_url ?? '',
    }
  }))
}

