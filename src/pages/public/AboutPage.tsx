import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// TODO(content): every string on this page is placeholder copy. Replace with
// the real company blurb, founding year, and figures before launch.
const FACTS = [
  { label: 'Operating since', value: 'TODO(content)' },
  { label: 'Vehicles shipped', value: 'TODO(content)' },
  { label: 'Destination ports', value: 'TODO(content)' },
]

export function AboutPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">About us</h1>
        <p className="text-muted-foreground max-w-2xl">
          {/* TODO(content): real company blurb. */}
          We are a car-import logistics company moving vehicles from US
          auctions to overseas buyers. This paragraph is placeholder copy and
          needs to be replaced with the real company description.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">What we do</h2>
        <p className="text-muted-foreground max-w-2xl">
          {/* TODO(content): real narrative. */}
          Placeholder: describe the inland transport network, the port
          relationships, and how shipments are tracked from auction to
          delivery.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {FACTS.map((fact) => (
          <Card key={fact.label}>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {fact.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {fact.value}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
