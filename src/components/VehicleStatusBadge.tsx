import { Badge } from '@/components/ui/badge'
import type { VehicleStatus } from '@/types/database'

/**
 * Read-only presentation of a vehicle's status.
 *
 * There is deliberately no editable counterpart on the customer side: status
 * is admin-only, enforced by the vehicles RLS policy and the
 * guard_vehicle_status trigger. This component renders, it never writes.
 */
const VARIANT_BY_STATUS: Record<
  VehicleStatus,
  'default' | 'secondary' | 'outline'
> = {
  'At Auction': 'outline',
  'In Transit': 'secondary',
  'At Port': 'secondary',
  'On Ocean': 'secondary',
  Delivered: 'default',
}

export function VehicleStatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">Unknown</Badge>

  const variant =
    VARIANT_BY_STATUS[status as VehicleStatus] ?? 'outline'

  return <Badge variant={variant}>{status}</Badge>
}
