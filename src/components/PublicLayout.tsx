import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/use-auth'
import { HeaderLogo } from '@/components/Logo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { MobileNav } from '@/components/MobileNav'
import { buttonVariants } from '@/components/ui/button'
import { SiteFooter } from '@/components/SiteFooter'
import { cn } from '@/lib/utils'

/** `key` indexes into the nav namespace; the label itself is translated. */
const NAV_ITEMS = [
  { to: '/', key: 'home', end: true },
  { to: '/services', key: 'services', end: false },
  { to: '/calculator', key: 'calculator', end: false },
  { to: '/tracking', key: 'tracking', end: false },
  { to: '/about', key: 'about', end: false },
  { to: '/contact', key: 'contact', end: false },
] as const

export function PublicLayout() {
  const { session } = useAuth()
  const { t } = useTranslation(['nav', 'common'])

  // Pills: the original's nav chips -- rounded-full, subtle tint when active.
  // Padding tightens below xl because Azerbaijani and Russian labels are
  // noticeably longer than English and would otherwise force a second row.
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'transition-smooth rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap xl:px-4',
      isActive
        ? 'bg-accent text-accent-foreground'
        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
    )

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border/60 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-xl">
        <nav className="container mx-auto flex flex-wrap items-center gap-1 px-4 py-3 sm:px-6">
          <Link to="/" className="mr-4 flex min-h-11 items-center md:min-h-0">
            <HeaderLogo />
          </Link>

          {/*
            `md:contents` makes this wrapper vanish from the layout at desktop,
            so the links stay direct flex children of <nav> exactly as before.
            Below md they are hidden and MobileNav takes over.
          */}
          <div className="hidden md:contents">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClass}
              >
                {t(`nav:${item.key}`)}
              </NavLink>
            ))}
          </div>

          <MobileNav items={NAV_ITEMS} className="ml-auto md:hidden" />

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            {session ? (
              <Link
                to="/dashboard"
                className={cn(
                  buttonVariants({ size: 'sm' }),
                  'rounded-full px-4 whitespace-nowrap',
                )}
              >
                {t('common:dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'rounded-full px-3 whitespace-nowrap',
                  )}
                >
                  {t('common:signIn')}
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    buttonVariants({ size: 'sm' }),
                    'shadow-soft rounded-full px-3 whitespace-nowrap',
                  )}
                >
                  {t('common:register')}
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
