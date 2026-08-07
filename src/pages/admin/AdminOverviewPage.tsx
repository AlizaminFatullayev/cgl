import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { callRpc } from '@/lib/admin-rpc'
import type { AdminOverviewStats } from '@/types/database'
import { formatCurrency } from '@/lib/format'
import { AdminError } from '@/components/AdminError'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint && (
        <CardContent className="text-muted-foreground text-sm">
          {hint}
        </CardContent>
      )}
    </Card>
  )
}

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void callRpc<AdminOverviewStats[]>('admin_overview_stats').then(
      ({ data, error: rpcError }) => {
        if (!active) return
        if (rpcError) {
          setError(rpcError)
        } else {
          setStats(data?.[0] ?? null)
        }
        setLoading(false)
      },
    )
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
        <span className="text-muted-foreground">Loading overview…</span>
      </div>
    )
  }

  if (error) return <AdminError message={`Could not load overview: ${error}`} />
  if (!stats) return <AdminError message="No overview data was returned." />

  const byStatus = [
    { label: 'At Auction', value: stats.at_auction },
    { label: 'In Transit', value: stats.in_transit },
    { label: 'At Port', value: stats.at_port },
    { label: 'On Ocean', value: stats.on_ocean },
    { label: 'Delivered', value: stats.delivered },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Customers" value={stats.customers} />
        <StatCard label="Vehicles" value={stats.vehicles_total} />
        <StatCard
          label="Unread messages"
          value={stats.unread_messages}
          hint={stats.unread_messages > 0 ? 'Needs attention' : undefined}
        />
        {/* Summed as SQL numeric in admin_overview_stats(), formatted here. */}
        <StatCard
          label="Total outstanding"
          value={formatCurrency(stats.outstanding)}
          hint="Sum of total_amount − paid"
        />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Vehicles by status
          </h2>
          <Link
            to="/admin/vehicles"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Manage vehicles
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {byStatus.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </section>
    </div>
  )
}
