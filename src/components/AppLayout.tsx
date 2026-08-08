import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { HeaderLogo } from '@/components/Logo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** `key` indexes into the nav namespace; the label itself is translated. */
const NAV_ITEMS = [
  { to: '/dashboard', key: 'home' as const, ns: 'common' as const },
  { to: '/vehicles', key: 'vehicles' as const, ns: 'nav' as const },
  { to: '/invoices', key: 'invoices' as const, ns: 'nav' as const },
  { to: '/transactions', key: 'transactions' as const, ns: 'nav' as const },
]

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation(['nav', 'common'])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  // Tighter padding below xl: az/ru labels are longer than the English ones.
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'transition-smooth rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap xl:px-4',
      isActive
        ? 'bg-accent text-accent-foreground'
        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
    )

  return (
    <div className="min-h-svh">
      <header className="border-border/60 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3">
          {/* Links back to the public site, which now owns "/". */}
          <Link to="/" className="mr-4 flex items-center">
            <HeaderLogo />
          </Link>

          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.ns === 'common'
                ? t('common:dashboard')
                : t(`nav:${item.key}`)}
            </NavLink>
          ))}

          {/*
            Convenience only -- RLS is what actually keeps non-admins out.
            'admin' here is the stored role value, never a translated string.
          */}
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              {t('nav:admin')}
            </NavLink>
          )}

          <div className="ml-auto flex items-center gap-2">
            {profile?.full_name && (
              <span className="text-muted-foreground hidden max-w-40 truncate text-sm lg:inline">
                {profile.full_name}
              </span>
            )}
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-3 whitespace-nowrap"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              {t('common:signOut')}
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
