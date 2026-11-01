import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export function AuthPage() {
  const { configured, signInWithGoogle, user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleSignIn() {
    setBusy(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Google sign-in could not start. Please try again.')
      setBusy(false)
    }
  }

  return <section className="auth-page">
    <p className="eyebrow">YOUR ACCOUNT</p>
    <h1>{user ? 'You’re signed in' : 'Sign in to YT Web'}</h1>
    <p className="auth-description">Use your Google account to continue. Your password is handled by Google and Supabase Auth.</p>
    {user ? <p className="auth-success">Signed in as {user.email ?? 'your Google account'}.</p> : <button className="google-button" onClick={handleGoogleSignIn} disabled={!configured || busy}>
      <GoogleMark />{busy ? 'Connecting…' : 'Continue with Google'}
    </button>}
    {!configured && <p className="auth-message" role="status">Supabase client keys are missing. Add them to the ignored <code>.env.local</code> file and restart Vite.</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <Link className="auth-back" to="/">Back to home</Link>
  </section>
}

function GoogleMark() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12z"/></svg>
}

