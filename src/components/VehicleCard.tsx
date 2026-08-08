import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageOff } from 'lucide-react'
import type { Vehicle } from '@/types/database'
import { displayText, formatCurrency, formatDate, vehicleTitle } from '@/lib/format'
import { signPhotoUrl } from '@/lib/storage'
import { VehicleStatusBadge } from '@/components/VehicleStatusBadge'
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
  const { t } = useTranslation('vehicles')
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const firstPhoto = vehicle.photoPaths[0] ?? null

  // The bucket is private, so a viewable URL has to be signed on demand.
  useEffect(() => {
    let active = true
    if (!firstPhoto) {
      setThumbnail(null)
      return
    }
    void signPhotoUrl(firstPhoto).then((url) => {
      if (active) setThumbnail(url)
    })
    return () => {
      active = false
    }
  }, [firstPhoto])

  return (
    <Card className="border-border/60 shadow-soft transition-smooth hover:shadow-elegant">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{vehicleTitle(vehicle)}</CardTitle>
          {/* Read-only. Status is admin-only and never editable here. */}
          <VehicleStatusBadge status={vehicle.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-secondary flex aspect-video items-center justify-center overflow-hidden rounded-xl">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={vehicleTitle(vehicle)}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImageOff className="text-muted-foreground size-6" />
          )}
        </div>

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
      </CardContent>
    </Card>
  )
}
