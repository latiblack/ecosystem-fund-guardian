import { useWallet } from '../context/WalletContext'
import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

/**
 * AuthGuard - Redirects unauthenticated users to connect wallet
 * Usage: <AuthGuard><YourComponent /></AuthGuard>
 */
export default function AuthGuard({ children }) {
  const { isAuthenticated, connectWallet } = useWallet()
  const location = useLocation()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Wait a tick to ensure wallet state is loaded
    const timer = setTimeout(() => setChecking(false), 100)
    return () => clearTimeout(timer)
  }, [])

  // Not authenticated and not on landing page
  if (!checking && !isAuthenticated && location.pathname !== '/') {
    // Trigger wallet connect modal
    connectWallet()
    // Redirect to landing page as fallback
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <>{children}</>
}
