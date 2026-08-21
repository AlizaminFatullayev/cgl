import { useTranslation } from 'react-i18next'
import type { Vehicle } from '@/types/database'
import {
  carLabel,
  displayText,
  formatCurrency,
  formatDateOnly,
} from '@/lib/format'

/**
 * The three-card detail panel from the reference "My Cars" page.
 *
 * Three columns on desktop, stacked on mobile. Every field in the reference is
 * rendered, whether or not we hold data for it yet -- a missing value shows an
 * em dash rather than being hidden, so the customer can see that the field
 * exists and is simply not filled in yet.
 *
 * Presentation only: it takes a vehicle plus the two profile-owned values and
 * renders. It fetches nothing and writes nothing.
 */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/40 flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-b py-1.5 last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  )
}

function Card({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-card border-border/60 rounded-xl border p-4">
      {/* Underlined heading, as in the reference -- in our brand colour. */}
      <h3 className="border-primary text-primary mb-3 border-b-2 pb-2 text-sm font-semibold tracking-tight">
        {heading}
      </h3>
      <dl>{children}</dl>
    </section>
  )
}

export function VehicleDetailsCards({
  vehicle,
  client,
  personalNumber,
}: {
  vehicle: Vehicle
  client: string
  personalNumber: string
}) {
  const { t } = useTranslation('cars')

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card heading={t('cardCar')}>
        <Row label={t('car')} value={carLabel(vehicle)} />
        <Row label={t('colVin')} value={displayText(vehicle.vin)} />
        <Row label={t('colLot')} value={displayText(vehicle.lot_number)} />
        <Row
          label={t('finalPrice')}
          value={formatCurrency(vehicle.final_price)}
        />
        <Row label={t('client')} value={client} />
        <Row label={t('personalNumber')} value={personalNumber} />
      </Card>

      <Card heading={t('cardAuction')}>
        <Row
          label={t('colAuctionDate')}
          value={formatDateOnly(vehicle.auction_date)}
        />
        <Row label={t('auction')} value={displayText(vehicle.auction_house)} />
        <Row label={t('state')} value={displayText(vehicle.auction_state)} />
        <Row label={t('city')} value={displayText(vehicle.auction_city)} />
        {/* Final price appears on both cards in the reference. Same column. */}
        <Row
          label={t('finalPrice')}
          value={formatCurrency(vehicle.final_price)}
        />
      </Card>

      <Card heading={t('cardTransport')}>
        <Row
          label={t('loadingPort')}
          value={displayText(vehicle.loading_port)}
        />
        <Row label={t('carrier')} value={displayText(vehicle.carrier)} />
        <Row
          label={t('auctionPickupDate')}
          value={formatDateOnly(vehicle.auction_pickup_date)}
        />
        <Row
          label={t('warehouseDeliveryDate')}
          value={formatDateOnly(vehicle.warehouse_delivery_date)}
        />
        <Row
          label={t('departureDate')}
          value={formatDateOnly(vehicle.departure_date)}
        />
        <Row
          label={t('entryDate')}
          value={formatDateOnly(vehicle.entry_date)}
        />
        <Row
          label={t('containerNumber')}
          value={displayText(vehicle.container_number)}
        />
        <Row label={t('openDate')} value={formatDateOnly(vehicle.open_date)} />
        {/* "Sea Line" in the reference is our existing shipping_line column. */}
        <Row label={t('seaLine')} value={displayText(vehicle.shipping_line)} />
        <Row label={t('terminal')} value={displayText(vehicle.terminal)} />
        <Row
          label={t('releaseDate')}
          value={formatDateOnly(vehicle.release_date)}
        />
      </Card>
    </div>
  )
}
