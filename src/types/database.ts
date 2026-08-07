/**
 * Hand-written mirrors of the SQL schema in supabase/migrations.
 *
 * Once the schema settles you can replace this file with generated types:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type UserRole = 'user' | 'admin'

export const VEHICLE_STATUSES = [
  'At Auction',
  'In Transit',
  'At Port',
  'On Ocean',
  'Delivered',
] as const

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]

export interface Profile {
  id: string
  full_name: string | null
  balance: number
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  user_id: string | null
  year: number | null
  make: string | null
  model: string | null
  vin: string | null
  lot_number: string | null
  container_number: string | null
  booking_number: string | null
  receiver: string | null
  shipping_line: string | null
  status: VehicleStatus
  total_amount: number
  paid: number
  notes: string | null
  created_at: string
}

export interface VehiclePhoto {
  id: string
  vehicle_id: string | null
  url: string | null
  created_at: string
}

export interface Invoice {
  id: string
  user_id: string | null
  vehicle_id: string | null
  amount: number | null
  status: string | null
  note: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string | null
  amount: number | null
  type: string
  created_at: string
}

export interface ShippingRate {
  id: string
  state_code: string | null
  state_name: string | null
  branch: string | null
  rate: number | null
}

/** See 0007_contact_messages.sql. Insertable by anyone, readable by admins. */
export interface ContactMessage {
  id: string
  name: string
  email: string
  vin: string | null
  message: string
  created_at: string
}
