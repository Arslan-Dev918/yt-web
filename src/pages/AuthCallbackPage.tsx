import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Finishing sign-in…')

  useEffect(() => {
    let active = true
    async function finishSignIn() {
      if (!supabase) {
        setMessage('Supabase is not configured for this app.')
        return
      }
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (!code) {
        const providerError = params.get('error_description') ?? params.get('error')
        window.history.replaceState({}, document.title, window.location.pathname)
        setMessage(providerError
          ? `Google sign-in failed: ${providerError}`
          : 'The sign-in link did not include an authorization code. Check the Google provider and redirect URL settings, then try again.')
        return
      }
      let error: Error | null = null
      try {
        const result = await supabase.auth.exchangeCodeForSession(code)
        error = result.error
      } catch (cause) {
        error = cause instanceof Error ? cause : new Error('Could not finish Google sign-in.')
      }
      if (!active) return
      window.history.replaceState({}, document.title, window.location.pathname)
      if (error) {
        setMessage(`Could not finish Google sign-in: ${error.message}`)
        return
      }
      navigate('/', { replace: true })
    }
    void finishSignIn().catch(() => {
      if (active) setMessage('Google sign-in could not be completed. Check your Supabase and Google OAuth settings, then try again.')
    })
    return () => { active = false }
  }, [navigate])

  return <section className="auth-page"><p className="eyebrow">ACCOUNT</p><h1>Sign-in status</h1><p className="auth-description" role="status">{message}</p><Link className="auth-back" to="/auth">Return to sign in</Link></section>
}

