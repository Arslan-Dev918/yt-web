import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { AuthProvider } from './auth/AuthProvider'
import { AuthPage } from './pages/AuthPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { AccountPage } from './pages/AccountPage'
import { ChannelPage } from './pages/ChannelPage'

export default function App() {
  return <AuthProvider><AppShell><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/account" element={<AccountPage />} />
    <Route path="/feed/:section" element={<PlaceholderPage />} />
    <Route path="/watch/:videoId" element={<PlaceholderPage />} />
    <Route path="/channel/:handle" element={<ChannelPage />} />
    <Route path="/search" element={<PlaceholderPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AppShell></AuthProvider>
}

