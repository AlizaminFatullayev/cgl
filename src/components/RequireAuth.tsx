import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/use-auth'
import { FullPageLoader } from './FullPageLoader'

/**
 * Gate for any signed-in area. Sends anonymous visitors to /login and
 * remembers where they were headed so login can bounce them back.
 */
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
