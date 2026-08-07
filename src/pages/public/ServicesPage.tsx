import { Anchor, Container, FileText, Ship, Truck, Warehouse } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// TODO(content): confirm this service list and rewrite the descriptions with
// the real copy from the original site.
const SERVICES = [
  {
    icon: Truck,
    title: 'Inland transportation',
    body: 'Pickup from any auction branch and delivery to the departure port. Rates for every state and branch are published in our calculator.',
  },
  {
    icon: Warehouse,
    title: 'Warehouse handling',
    body: 'Short-term storage at the port warehouse while the vehicle waits for its container slot.',
  },
  {
    icon: Container,
    title: 'Container loading',
    body: 'Consolidated and dedicated container loading, with photos taken before the container is sealed.',
  },
  {
    icon: Ship,
    title: 'Ocean freight',
    body: 'Booking with the shipping line, container and booking numbers recorded against your vehicle.',
  },
  {
    icon: Anchor,
    title: 'Port handling at destination',
    body: 'Unloading, terminal handling, and release coordination with the receiver named on the file.',
  },
  {
    icon: FileText,
    title: 'Documentation',
    body: 'Title, bill of lading, and export paperwork prepared and tracked alongside the shipment.',
  },
]

export function ServicesPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Services</h1>
        <p className="text-muted-foreground max-w-2xl">
          Everything between the auction lot and the destination port.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {SERVICES.map((service) => (
          <Card key={service.title}>
            <CardHeader>
              <service.icon className="text-muted-foreground size-5" />
              <CardTitle className="text-base">{service.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              {service.body}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
