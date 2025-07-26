import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { blink } from './blink/client'
import LoadingScreen from './components/LoadingScreen'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import BotBuilder from './pages/BotBuilder'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

interface User {
  id: string
  email: string
  displayName?: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/bot/:botId/builder" 
          element={user ? <BotBuilder user={user} /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/bot/:botId/analytics" 
          element={user ? <Analytics user={user} /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/settings" 
          element={user ? <Settings user={user} /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  )
}

export default App