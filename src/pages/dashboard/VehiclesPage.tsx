import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Loader2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/use-auth'
import type { Vehicle, VehiclePhoto } from '@/types/database'
import { buttonVariants } from '@/components/ui/button'
import { VehicleCard, type VehicleWithPhotos } from '@/components/VehicleCard'

export function VehiclesPage() {
  const { session } = useAuth()
  const userId = session?.user.id ?? null

  const [vehicles, setVehicles] = useState<VehicleWithPhotos[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    // RLS already limits this to the caller's own rows; the explicit
    // user_id filter keeps the intent visible and the query index-friendly.
    const { data: vehicleRows, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<Vehicle[]>()

    if (vehicleError) {
      setError(vehicleError.message)
      setVehicles([])
      setLoading(false)
      return
    }

    const rows = vehicleRows ?? []
    if (rows.length === 0) {
      setVehicles([])
      setLoading(false)
      return
    }

    const { data: photoRows, error: photoError } = await supabase
      .from('vehicle_photos')
      .select('id, vehicle_id, url, created_at')
      .in(
        'vehicle_id',
        rows.map((row) => row.id),
      )
      .order('created_at', { ascending: true })
      .returns<VehiclePhoto[]>()

    // A photo failure should not hide the vehicles themselves.
    const pathsByVehicle = new Map<string, string[]>()
    if (!photoError) {
      for (const photo of photoRows ?? []) {
        if (!photo.vehicle_id || !photo.url) continue
        const list = pathsByVehicle.get(photo.vehicle_id) ?? []
        list.push(photo.url)
        pathsByVehicle.set(photo.vehicle_id, list)
      }
    }

    setVehicles(
      rows.map((row) => ({
        ...row,
        photoPaths: pathsByVehicle.get(row.id) ?? [],
      })),
    )
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">My vehicles</h1>
        <Link to="/vehicles/new" className={buttonVariants()}>
          <Plus className="size-4" />
          Add vehicle
        </Link>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-10">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
          <span className="text-muted-foreground">Loading your vehicles…</span>
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>Could not load your vehicles: {error}</span>
        </div>
      )}

      {!loading && !error && vehicles.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            You have not added a vehicle yet.
          </p>
          <Link
            to="/vehicles/new"
            className={buttonVariants({ variant: 'outline' })}
          >
            Add your first vehicle
          </Link>
        </div>
      )}

      {!loading && !error && vehicles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  )
}
