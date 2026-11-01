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
      const code = new URLSearchParams(window.location.search).get('code')
      if (!code) {
        setMessage('The sign-in link did not include an authorization code. Start again from the sign-in page.')
        return
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!active) return
      window.history.replaceState({}, document.title, window.location.pathname)
      if (error) {
        setMessage(error.message)
        return
      }
      navigate('/', { replace: true })
    }
    void finishSignIn()
    return () => { active = false }
  }, [navigate])

  return <section className="auth-page"><p className="eyebrow">ACCOUNT</p><h1>Sign-in status</h1><p className="auth-description" role="status">{message}</p><Link className="auth-back" to="/auth">Return to sign in</Link></section>
}

