import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Car, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/use-auth'
import { displayText, formatCurrency } from '@/lib/format'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function DashboardPage() {
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
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {/*
          Profile is display-only here. full_name is editable by the user at
          the database level, but balance is admin-only -- there is no control
          on this page that writes either one.
        */}
        <Card>
          <CardHeader>
            <CardDescription>Account</CardDescription>
            <CardTitle className="text-lg">
              {displayText(profile?.full_name, 'No name set')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground truncate text-sm">
            {displayText(session?.user.email)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Balance</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatCurrency(profile?.balance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Managed by our staff.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Vehicles</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {vehicleCount ?? '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              to="/vehicles"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <Car className="size-4" />
              View all
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/vehicles/new" className={buttonVariants()}>
          <Plus className="size-4" />
          Add vehicle
        </Link>
      </div>
    </div>
  )
}
