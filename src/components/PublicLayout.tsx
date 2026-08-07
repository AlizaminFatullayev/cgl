import { Link, NavLink, Outlet } from 'react-router-dom'
import { Ship } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { buttonVariants } from '@/components/ui/button'
import { SiteFooter } from '@/components/SiteFooter'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services', end: false },
  { to: '/calculator', label: 'Calculator', end: false },
  { to: '/tracking', label: 'Tracking', end: false },
  { to: '/about', label: 'About', end: false },
  { to: '/contact', label: 'Contact', end: false },
]

export function PublicLayout() {
  const { session } = useAuth()

  // Pills: the original's nav chips -- rounded-full, subtle tint when active.
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'transition-smooth rounded-full px-4 py-2 text-sm font-medium',
      isActive
        ? 'bg-accent text-accent-foreground'
        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
    )

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border/60 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-xl">
        <nav className="container mx-auto flex flex-wrap items-center gap-1 px-4 py-3 sm:px-6">
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
                className={cn(buttonVariants({ size: 'sm' }), 'rounded-full px-4')}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'rounded-full px-4',
                  )}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    buttonVariants({ size: 'sm' }),
                    'shadow-soft rounded-full px-4',
                  )}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/*
        Full-bleed on purpose: the marketing sections alternate between plain
        and tinted bands that must span the viewport. Each page supplies its
        own `container mx-auto px-4 sm:px-6` inside <Section>.
      */}
      <main className="w-full flex-1">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  )
}
