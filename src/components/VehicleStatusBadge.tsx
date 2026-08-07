import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { VehicleStatus } from '@/types/database'

/**
 * Read-only presentation of a vehicle's status.
 *
 * There is deliberately no editable counterpart on the customer side: status
 * is admin-only, enforced by the vehicles RLS policy and the
 * guard_vehicle_status trigger. This component renders, it never writes.
 *
 * The palette runs muted -> progressively deeper primary tints -> success, so
 * the journey reads left to right. Every pairing below clears WCAG AA:
 * muted-foreground on muted is 4.88:1, accent-foreground (#002d5e) on any of
 * these blue tints is above 10:1, and success-strong on success-soft is
 * 5.49:1. The raw --success (#04ab62) is only ever a border here, never text.
 */
const CLASS_BY_STATUS: Record<VehicleStatus, string> = {
  'At Auction': 'bg-muted text-muted-foreground border-border',
  'In Transit': 'bg-secondary text-accent-foreground border-primary/20',
  'At Port': 'bg-accent text-accent-foreground border-primary/30',
  'On Ocean': 'bg-primary/15 text-accent-foreground border-primary/40',
  Delivered: 'bg-success-soft text-success-strong border-success/40',
}

export function VehicleStatusBadge({ status }: { status: string | null }) {
  const className = status
    ? CLASS_BY_STATUS[status as VehicleStatus]
    : undefined

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full font-medium',
        className ?? 'bg-muted text-muted-foreground border-border',
      )}
    >
      {status ?? 'Unknown'}
    </Badge>
  )
}
