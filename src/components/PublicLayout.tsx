import { Link, NavLink, Outlet } from 'react-router-dom'
import { Ship } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services', end: false },
  { to: '/calculator', label: 'Calculator', end: false },
  { to: '/about', label: 'About', end: false },
  { to: '/contact', label: 'Contact', end: false },
]

export function PublicLayout() {
  const { session } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-secondary text-secondary-foreground'
        : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-3">
          <Link to="/" className="mr-4 flex items-center gap-2 font-semibold">
            <Ship className="size-5" />
            CGL
          </Link>

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
            >
              {item.label}
            </NavLink>
          ))}

          <div className="ml-auto flex items-center gap-2">
            {session ? (
              <Link
                to="/dashboard"
                className={buttonVariants({ size: 'sm' })}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className={buttonVariants({ size: 'sm' })}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto max-w-5xl px-4 py-6 text-sm">
          {/* TODO(content): replace with real company details. */}
          CGL — Car Import Logistics
        </div>
      </footer>
    </div>
  )
}
