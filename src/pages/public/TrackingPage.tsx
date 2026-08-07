import { useState } from 'react'
import { Check, Loader2, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { VEHICLE_STATUSES, type Vehicle } from '@/types/database'
import { displayText, formatDate, vehicleTitle } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Section, SectionHeading } from '@/components/Section'
import { VehicleStatusBadge } from '@/components/VehicleStatusBadge'
import { cn } from '@/lib/utils'

type Result =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'found'; vehicle: Vehicle }
  | { kind: 'missing' }

export function TrackingPage() {
  const [vin, setVin] = useState('')
  const [result, setResult] = useState<Result>({ kind: 'idle' })
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const trimmed = vin.trim().toUpperCase()
    if (trimmed.length !== 17) {
      setFormError('A VIN is exactly 17 characters.')
      return
    }

    setResult({ kind: 'searching' })

    /*
      This is a plain RLS-governed read -- no service_role, no policy
      workaround. The vehicles SELECT policy is `to authenticated` and limited
      to `user_id = auth.uid() or is_admin()`, so:
        - a signed-out visitor gets zero rows for every VIN
        - a signed-in customer only ever matches their own vehicles
      Anything the caller may not read is reported as "not found or not
      available" rather than leaking that the row exists.
    */
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vin', trimmed)
      .maybeSingle<Vehicle>()

    if (error) {
      setFormError(`Could not run the lookup: ${error.message}`)
      setResult({ kind: 'idle' })
      return
    }

    setResult(data ? { kind: 'found', vehicle: data } : { kind: 'missing' })
  }

  const vehicle = result.kind === 'found' ? result.vehicle : null
  const currentStage = vehicle
    ? VEHICLE_STATUSES.indexOf(vehicle.status)
    : -1

  return (
    <Section>
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="TRACKING"
          title="Track your vehicle"
          subtitle="Enter the 17-character VIN to see live status."
          centered
        />

        <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-xl" noValidate>
          <Label htmlFor="vin-input" className="sr-only">
            VIN
          </Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="vin-input"
              value={vin}
              onChange={(event) => setVin(event.target.value)}
              placeholder="1HGCM82633A004352"
              maxLength={17}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(formError)}
              aria-describedby={formError ? 'vin-error' : undefined}
              className="font-mono uppercase sm:flex-1"
            />
            <Button
              type="submit"
              className="shadow-soft rounded-full px-6"
              disabled={result.kind === 'searching'}
            >
              {result.kind === 'searching' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Track
            </Button>
          </div>
          {formError && (
            <p id="vin-error" role="alert" className="text-destructive mt-2 text-sm">
              {formError}
            </p>
          )}
        </form>

        {result.kind === 'missing' && (
          <Card className="border-border/60 shadow-soft mx-auto mt-8 max-w-xl">
            <CardContent className="pt-6 text-center">
              <p className="font-medium">Not found or not available</p>
              <p className="text-muted-foreground mt-2 text-sm">
                We could not find a vehicle you can view with that VIN. If the
                car is yours, sign in first — tracking shows the vehicles on
                your own account.
              </p>
            </CardContent>
          </Card>
        )}

        {vehicle && (
          <div className="mt-10 space-y-6">
            <Card className="border-border/60 shadow-soft">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">
                      {vehicleTitle(vehicle)}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1 font-mono text-sm">
                      {displayText(vehicle.vin)}
                    </p>
                  </div>
                  {/* Read-only: status is never editable outside the admin panel. */}
                  <VehicleStatusBadge status={vehicle.status} />
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground text-sm">Container</dt>
                    <dd className="font-medium">
                      {displayText(vehicle.container_number)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-sm">Booking</dt>
                    <dd className="font-medium">
                      {displayText(vehicle.booking_number)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-sm">Added</dt>
                    <dd className="font-medium">
                      {formatDate(vehicle.created_at)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-soft">
              <CardHeader>
                <CardTitle className="text-base">Status timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-0">
                  {VEHICLE_STATUSES.map((stage, index) => {
                    const done = index <= currentStage
                    const isCurrent = index === currentStage
                    return (
                      <li key={stage} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-full border-2',
                              done
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-border bg-card text-muted-foreground',
                            )}
                          >
                            {done ? (
                              <Check className="size-4" aria-hidden="true" />
                            ) : (
                              <span className="text-xs font-semibold">
                                {index + 1}
                              </span>
                            )}
                          </span>
                          {index < VEHICLE_STATUSES.length - 1 && (
                            <span
                              aria-hidden="true"
                              className={cn(
                                'w-0.5 flex-1',
                                index < currentStage
                                  ? 'bg-primary'
                                  : 'bg-border',
                              )}
                            />
                          )}
                        </div>
                        <div className="pb-6">
                          <p
                            className={cn(
                              'font-medium',
                              done ? 'text-foreground' : 'text-muted-foreground',
                            )}
                          >
                            {stage}
                            {isCurrent && (
                              <span className="text-primary ml-2 text-sm font-semibold">
                                Current
                              </span>
                            )}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Section>
  )
}
