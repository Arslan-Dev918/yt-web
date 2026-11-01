import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

type Profile = { username: string | null; display_name: string; avatar_url: string | null; bio: string | null }
type Channel = { id: string; name: string; handle: string; description: string; avatar_url: string | null; banner_url: string | null }

function validOptionalUrl(value: string) {
  if (!value.trim()) return true
  try { return new URL(value).protocol === 'https:' } catch { return false }
}

export function AccountPage() {
  const { user, loading, configured } = useAuth()
  const [profile, setProfile] = useState<Profile>({ username: '', display_name: '', avatar_url: '', bio: '' })
  const [channel, setChannel] = useState<Channel | null>(null)
  const [channelForm, setChannelForm] = useState({ name: '', handle: '', description: '', avatar_url: '', banner_url: '' })
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !supabase) return
    let active = true
    void Promise.all([
      supabase.from('profiles').select('username,display_name,avatar_url,bio').eq('id', user.id).maybeSingle(),
      supabase.from('channels').select('id,name,handle,description,avatar_url,banner_url').eq('owner_id', user.id).maybeSingle(),
    ]).then(([profileResult, channelResult]) => {
      if (!active) return
      if (profileResult.error || channelResult.error) {
        setError('We could not load your account details. Please refresh and try again.')
        return
      }
      if (profileResult.data) setProfile(profileResult.data)
      if (channelResult.data) {
        setChannel(channelResult.data)
        setChannelForm({ name: channelResult.data.name, handle: channelResult.data.handle, description: channelResult.data.description, avatar_url: channelResult.data.avatar_url ?? '', banner_url: channelResult.data.banner_url ?? '' })
      } else {
        const suggested = String(user.user_metadata.user_name ?? user.email?.split('@')[0] ?? 'creator').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)
        setChannelForm(current => ({ ...current, handle: suggested || 'creator' }))
      }
    })
    return () => { active = false }
  }, [user])

  if (loading) return <section className="account-page"><p>Loading your account…</p></section>
  if (!user) return <Navigate to="/auth" replace />
  if (!configured || !supabase) return <section className="account-page"><h1>Account unavailable</h1><p>Supabase is not configured for this deployment.</p></section>

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !supabase) return
    setBusy(true); setError(''); setStatus('')
    const username = profile.username?.trim().toLowerCase() || null
    if (username && !/^[a-z0-9_]{3,24}$/.test(username)) {
      setError('Username must be 3–24 characters and use only letters, numbers, and underscores.')
      setBusy(false); return
    }
    if (!validOptionalUrl(profile.avatar_url ?? '')) {
      setError('Profile image URL must use https.')
      setBusy(false); return
    }
    const { error: saveError } = await supabase.from('profiles').update({
      username,
      display_name: profile.display_name.trim(),
      avatar_url: profile.avatar_url?.trim() || null,
      bio: profile.bio?.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setBusy(false)
    if (saveError) {
      setError(saveError.code === '23505' ? 'That username is already in use.' : 'Profile could not be saved. Please check your details and try again.')
      return
    }
    setProfile(current => ({ ...current, username }))
    setStatus('Profile saved.')
  }

  async function createChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !supabase || channel) return
    setBusy(true); setError(''); setStatus('')
    const name = channelForm.name.trim()
    const handle = channelForm.handle.trim().replace(/^@/, '').toLowerCase()
    if (name.length < 2 || name.length > 60) {
      setError('Channel name must be between 2 and 60 characters.')
      setBusy(false); return
    }
    if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
      setError('Channel handle must be 3–30 characters and use only letters, numbers, and underscores.')
      setBusy(false); return
    }
    if (!validOptionalUrl(channelForm.avatar_url) || !validOptionalUrl(channelForm.banner_url)) {
      setError('Channel image URLs must use https.')
      setBusy(false); return
    }
    const { data, error: createError } = await supabase.from('channels').insert({
      owner_id: user.id,
      name,
      handle,
      description: channelForm.description.trim(),
      avatar_url: channelForm.avatar_url.trim() || null,
      banner_url: channelForm.banner_url.trim() || null,
    }).select('id,name,handle,description,avatar_url,banner_url').single()
    setBusy(false)
    if (createError) {
      setError(createError.code === '23505' ? 'This handle is already taken, or your account already has a channel.' : 'Channel could not be created. Please try again.')
      return
    }
    setChannel(data)
    setStatus('Your channel is ready.')
  }

  async function saveChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !supabase || !channel) return
    setBusy(true); setError(''); setStatus('')
    const name = channelForm.name.trim()
    const handle = channelForm.handle.trim().replace(/^@/, '').toLowerCase()
    if (name.length < 2 || name.length > 60 || !/^[a-z0-9_]{3,30}$/.test(handle)) {
      setError('Check the channel name and handle. Handles need 3–30 letters, numbers, or underscores.')
      setBusy(false); return
    }
    if (!validOptionalUrl(channelForm.avatar_url) || !validOptionalUrl(channelForm.banner_url)) {
      setError('Channel image URLs must use https.')
      setBusy(false); return
    }
    const { data, error: saveError } = await supabase.from('channels').update({
      name, handle, description: channelForm.description.trim(),
      avatar_url: channelForm.avatar_url.trim() || null,
      banner_url: channelForm.banner_url.trim() || null,
    }).eq('id', channel.id).eq('owner_id', user.id).select('id,name,handle,description,avatar_url,banner_url').single()
    setBusy(false)
    if (saveError) {
      setError(saveError.code === '23505' ? 'That channel handle is already in use.' : 'Channel could not be updated. Please try again.')
      return
    }
    setChannel(data)
    setStatus('Channel saved.')
  }

  return <section className="account-page">
    <header className="account-page-header"><p className="eyebrow">ACCOUNT SETTINGS</p><h1>Your account</h1><p>Manage your VisTube profile and creator channel.</p></header>
    {error && <p className="form-feedback form-error" role="alert">{error}</p>}
    {status && <p className="form-feedback form-success" role="status">{status}</p>}
    <form className="settings-card" onSubmit={saveProfile}>
      <h2>Profile</h2><p className="settings-hint">Signed in as {user.email}</p>
      <label>Display name<input required minLength={1} maxLength={60} value={profile.display_name} onChange={e => setProfile({ ...profile, display_name: e.target.value })}/></label>
      <label>Username<input minLength={3} maxLength={24} autoComplete="username" placeholder="your_name" value={profile.username ?? ''} onChange={e => setProfile({ ...profile, username: e.target.value })}/><small>Letters, numbers, and underscores.</small></label>
      <label>Profile image URL<input type="url" maxLength={500} placeholder="https://…" value={profile.avatar_url ?? ''} onChange={e => setProfile({ ...profile, avatar_url: e.target.value })}/><small>Use a secure https image URL. Image uploads will be added with creator media tools.</small></label>
      <label>Bio<textarea maxLength={500} rows={4} value={profile.bio ?? ''} onChange={e => setProfile({ ...profile, bio: e.target.value })}/></label>
      <button className="form-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
    </form>
    <form className="settings-card" onSubmit={channel ? saveChannel : createChannel}>
      <h2>{channel ? 'Your channel' : 'Create your channel'}</h2>
      {channel && <><p className="settings-hint">Your creator channel is live.</p><Link className="channel-preview-link" to={`/channel/${channel.handle}`}>Visit @{channel.handle}</Link></>}
      <>
        {!channel && <p className="settings-hint">Choose a unique handle for your public channel.</p>}
        <label>Channel name<input required minLength={2} maxLength={60} value={channelForm.name} onChange={e => setChannelForm({ ...channelForm, name: e.target.value })}/></label>
        <label>Channel handle<div className="handle-input"><span>@</span><input required minLength={3} maxLength={30} autoComplete="off" value={channelForm.handle} onChange={e => setChannelForm({ ...channelForm, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}/></div><small>3–30 letters, numbers, or underscores.</small></label>
        <label>Channel avatar URL<input type="url" maxLength={500} placeholder="https://…" value={channelForm.avatar_url} onChange={e => setChannelForm({ ...channelForm, avatar_url: e.target.value })}/><small>Optional secure https image URL.</small></label>
        <label>Channel banner URL<input type="url" maxLength={500} placeholder="https://…" value={channelForm.banner_url} onChange={e => setChannelForm({ ...channelForm, banner_url: e.target.value })}/><small>Optional secure https image URL.</small></label>
        <label>Description<textarea maxLength={1000} rows={4} value={channelForm.description} onChange={e => setChannelForm({ ...channelForm, description: e.target.value })}/></label>
        <button className="form-primary" disabled={busy}>{busy ? 'Saving…' : channel ? 'Save channel' : 'Create channel'}</button>
      </>
    </form>
  </section>
}

