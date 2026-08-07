import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/vehicles', label: 'Vehicles', end: false },
  { to: '/admin/customers', label: 'Customers', end: false },
  { to: '/admin/rates', label: 'Rates', end: false },
  { to: '/admin/invoices', label: 'Invoices', end: false },
  { to: '/admin/messages', label: 'Messages', end: false },
]

export function AdminLayout() {
  return (
    <div className="space-y-8">
      {/* Same pill language as the public and customer shells -- one product. */}
      <nav className="border-border/60 bg-secondary/50 flex flex-wrap gap-1 rounded-2xl border p-1.5">
        {ADMIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'transition-smooth rounded-full px-4 py-2 text-sm font-medium',
                isActive
                  ? 'bg-card text-primary shadow-soft'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
