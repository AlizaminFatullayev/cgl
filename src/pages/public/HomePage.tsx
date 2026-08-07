import { Link } from 'react-router-dom'
import { Calculator, FileCheck, Ship, Truck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// TODO(content): replace all copy on this page with the real marketing text.
const STEPS = [
  {
    icon: FileCheck,
    title: 'Buy at auction',
    body: 'Win your vehicle at a US auction and send us the lot details.',
  },
  {
    icon: Truck,
    title: 'Inland transport',
    body: 'We move the vehicle from the auction branch to the departure port.',
  },
  {
    icon: Ship,
    title: 'Ocean freight',
    body: 'The vehicle is loaded into a container and shipped to destination.',
  },
  {
    icon: Calculator,
    title: 'Track and clear',
    body: 'Follow every status change in your dashboard until delivery.',
  },
]

export function HomePage() {
  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Car import logistics, end to end
        </h1>
        {/* TODO(content): real value proposition. */}
        <p className="text-muted-foreground max-w-2xl text-lg">
          We handle inland transport, ocean freight, and delivery for vehicles
          bought at US auctions — with every step visible in one place.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/calculator" className={buttonVariants()}>
            <Calculator className="size-4" />
            Calculate shipping
          </Link>
          <Link
            to="/services"
            className={buttonVariants({ variant: 'outline' })}
          >
            See services
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Card key={step.title}>
              <CardHeader>
                <step.icon className="text-muted-foreground size-5" />
                <CardTitle className="text-base">
                  {index + 1}. {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {step.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 space-y-4 rounded-lg border p-6">
        <h2 className="text-xl font-semibold tracking-tight">
          Know the cost before you bid
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          Pick the auction state and branch to see the transportation total.
          Rates come straight from our published rate table.
        </p>
        <Link
          to="/calculator"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Open the calculator
        </Link>
      </section>
    </div>
  )
}
