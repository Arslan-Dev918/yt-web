import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return <AppShell><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/feed/:section" element={<PlaceholderPage />} />
    <Route path="/watch/:videoId" element={<PlaceholderPage />} />
    <Route path="/channel/:handle" element={<PlaceholderPage />} />
    <Route path="/search" element={<PlaceholderPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AppShell>
}
