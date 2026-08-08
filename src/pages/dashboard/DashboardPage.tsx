import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Car, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/use-auth'
import { displayText, formatCurrency } from '@/lib/format'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function DashboardPage() {
  const { t } = useTranslation(['dashboard', 'common'])
  const { session, profile } = useAuth()
  const userId = session?.user.id ?? null
  const [vehicleCount, setVehicleCount] = useState<number | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true
    void supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(({ count, error }) => {
        if (!active) return
        setVehicleCount(error ? null : (count ?? 0))
      })
    return () => {
      active = false
    }
  }, [userId])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

      <div className="grid gap-5 sm:grid-cols-3">
        {/*
          Profile is display-only here. full_name is editable by the user at
          the database level, but balance is admin-only -- there is no control
          on this page that writes either one.
        */}
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardDescription>{t('account')}</CardDescription>
            <CardTitle className="text-lg">
              {displayText(profile?.full_name, t('noNameSet'))}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground truncate text-sm">
            {displayText(session?.user.email)}
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle border-border/60 shadow-soft">
          <CardHeader>
            <CardDescription>{t('balance')}</CardDescription>
            <CardTitle className="text-primary text-3xl font-bold tabular-nums">
              {formatCurrency(profile?.balance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {t('balanceHint')}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardDescription>{t('vehicles')}</CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums">
              {vehicleCount ?? '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              to="/vehicles"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'rounded-full px-4',
              )}
            >
              <Car className="size-4" />
              {t('viewAll')}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/vehicles/new"
          className={cn(buttonVariants(), 'shadow-soft rounded-full px-6')}
        >
          <Plus className="size-4" />
          {t('addVehicle')}
        </Link>
      </div>
    </div>
  )
}
