import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { HeaderLogo } from '@/components/Logo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NavItem = {
  readonly to: string
  readonly key: string
  readonly end: boolean
}

/**
 * Below `md` the header's horizontal nav is hidden and this hamburger takes
 * its place, opening a right-hand drawer with the same links plus the language
 * switcher and the auth actions.
 *
 * Built on the Base UI dialog that already backs `components/ui/dialog`, so
 * focus trapping, Escape, backdrop dismissal, page-scroll locking and focus
 * return to the trigger all come from the primitive rather than being
 * hand-rolled. `modal` (the default) is what turns those on. The primitive's
 * Trigger also emits aria-expanded / aria-haspopup / aria-controls for us.
 *
 * The drawer is a separate component rather than markup inside PublicLayout so
 * the desktop header keeps exactly the DOM it had before.
 */
export function MobileNav({
  items,
  className,
}: {
  items: readonly NavItem[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const { session } = useAuth()
  const { t } = useTranslation(['nav', 'common'])
  const { pathname } = useLocation()

  // Close on route change. Clicking a link that lands on the current route
  // does not change `pathname`, so the links below also close on click.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button
            variant="ghost"
            // 44px square: the minimum comfortable touch target.
            className={cn('size-11 rounded-full', className)}
            aria-label={t('common:openMenu')}
          />
        }
      >
        <Menu className="size-5" aria-hidden="true" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 duration-200 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />

        <Dialog.Popup className="bg-background fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col overflow-y-auto shadow-xl duration-200 outline-none data-closed:animate-out data-closed:slide-out-to-right data-open:animate-in data-open:slide-in-from-right">
          <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
            <Dialog.Title className="sr-only">{t('common:menu')}</Dialog.Title>
            <Link to="/" aria-label="CGL">
              <HeaderLogo />
            </Link>
            <Dialog.Close
              render={
                <Button
                  variant="ghost"
                  className="size-11 rounded-full"
                  aria-label={t('common:close')}
                />
              }
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <nav className="flex flex-col gap-1 p-3">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'transition-smooth rounded-xl px-4 py-3 text-base font-medium',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )
                }
              >
                {t(`nav:${item.key}`)}
              </NavLink>
            ))}
          </nav>

          <div className="border-border/60 mt-auto flex flex-col gap-3 border-t p-4">
            <LanguageSwitcher className="self-start" />

            {session ? (
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants(),
                  'h-11 w-full rounded-full',
                )}
              >
                {t('common:dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'h-11 w-full rounded-full',
                  )}
                >
                  {t('common:signIn')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants(),
                    'shadow-soft h-11 w-full rounded-full',
                  )}
                >
                  {t('common:register')}
                </Link>
              </>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
