import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Ship } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/transactions', label: 'Transactions' },
]

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'transition-smooth rounded-full px-4 py-2 text-sm font-medium',
      isActive
        ? 'bg-accent text-accent-foreground'
        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
    )

  return (
    <div className="min-h-svh">
      <header className="border-border/60 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3">
          {/* Links back to the public site, which now owns "/". */}
          <Link
            to="/"
            className="text-foreground mr-4 flex items-center gap-2 text-base font-bold tracking-tight"
          >
            <span className="bg-gradient-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Ship className="size-4" />
            </span>
            CGL
          </Link>

          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}

          {/* Convenience only -- RLS is what actually keeps non-admins out. */}
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}

          <div className="ml-auto flex items-center gap-3">
            {profile?.full_name && (
              <span className="text-muted-foreground hidden text-sm sm:inline">
                {profile.full_name}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-4"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  )
}
