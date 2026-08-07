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
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 border-b pb-3">
        {ADMIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
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
