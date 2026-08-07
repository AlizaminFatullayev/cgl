import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/use-auth'
import { FullPageLoader } from './FullPageLoader'

/**
 * Gate for admin-only areas. Nest this inside <RequireAuth>.
 *
 * This is a convenience redirect, not a security boundary -- the real guard
 * is the RLS policies, which check is_admin() on every row.
 */
export function RequireAdmin() {
  const { profile, loading } = useAuth()

  if (loading) return <FullPageLoader />

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
