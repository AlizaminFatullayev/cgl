import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import type { Vehicle } from '@/types/database'
import { displayText, formatCurrency, formatDate, vehicleTitle } from '@/lib/format'
import { VehiclePhotoGrid } from '@/components/VehiclePhotoGrid'
import { VehicleStatusBadge } from '@/components/VehicleStatusBadge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export interface VehicleWithPhotos extends Vehicle {
  photoPaths: string[]
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/40 flex justify-between gap-4 border-b py-1.5 last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

export function VehicleCard({ vehicle }: { vehicle: VehicleWithPhotos }) {
  const { t } = useTranslation(['vehicles', 'common', 'photos'])
  const title = vehicleTitle(vehicle)

  return (
    <Card className="border-border/60 shadow-soft transition-smooth hover:shadow-elegant">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{title}</CardTitle>
          {/* Read-only. Status is admin-only and never editable here. */}
          <VehicleStatusBadge status={vehicle.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/*
          One cover photo on the card; the viewer it opens carries every photo
          on the car, so the rest are one click and a swipe away rather than
          crowding the card.
        */}
        <VehiclePhotoGrid
          paths={vehicle.photoPaths}
          title={title}
          variant="cover"
        />

        <dl className="text-sm">
          <DetailRow label={t('vin')} value={displayText(vehicle.vin)} />
          <DetailRow label={t('lot')} value={displayText(vehicle.lot_number)} />
          <DetailRow
            label={t('container')}
            value={displayText(vehicle.container_number)}
          />
          <DetailRow
            label={t('booking')}
            value={displayText(vehicle.booking_number)}
          />
          <DetailRow label={t('receiver')} value={displayText(vehicle.receiver)} />
          <DetailRow
            label={t('shippingLine')}
            value={displayText(vehicle.shipping_line)}
          />
          <DetailRow
            label={t('total')}
            value={formatCurrency(vehicle.total_amount)}
          />
          <DetailRow label={t('paid')} value={formatCurrency(vehicle.paid)} />
          <DetailRow label={t('added')} value={formatDate(vehicle.created_at)} />
        </dl>

        {vehicle.notes?.trim() && (
          <p className="text-muted-foreground border-t pt-3 text-sm">
            {vehicle.notes}
          </p>
        )}

        {/*
          Corrects a typo in what the customer typed. It edits only the fields
          they supplied -- never status, never the money columns. The database
          is what enforces that (guard_customer_vehicle_columns), not this link.
        */}
        <div className="flex justify-end pt-1">
          <Link
            to={`/vehicles/${vehicle.id}/edit`}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-11 rounded-full px-5 md:h-9',
            )}
          >
            <Pencil className="size-4" aria-hidden="true" />
            {t('common:edit')}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
