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

/**
 * Where the car physically is. Added in 0013.
 *
 * This is NOT vehicles.status and the two must never be conflated: status is
 * the shipping lifecycle, location is the filter axis on the My Cars page.
 * Like status, these are the exact values stored in the column (a CHECK
 * constraint enforces them) -- translate for display only, never in a query.
 */
export const VEHICLE_LOCATIONS = [
  'Auction',
  'Warehouse',
  'Container',
  'Parking',
  'Out',
] as const

export type VehicleLocation = (typeof VEHICLE_LOCATIONS)[number]

/**
 * Gallery column a photo files under. Added in 0013.
 *
 * Lowercase English keys, CHECK-constrained, NOT NULL DEFAULT 'auction' -- so
 * a photo row can never be uncategorised, and every row that existed before
 * 0013 was backfilled to 'auction'.
 */
export const PHOTO_CATEGORIES = ['auction', 'stock', 'driver', 'poti'] as const

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number]

export interface Profile {
  id: string
  full_name: string | null
  balance: number
  role: UserRole
  created_at: string
  updated_at: string
  /** Added in 0013. Identity data our staff verify -- admin-writable only. */
  personal_number: string | null
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

  /*
    Added in 0013. All admin-writable only: the customer edit path
    (guard_customer_vehicle_columns) whitelists none of them, and the insert
    path (guard_customer_vehicle_insert) resets them to their defaults.

    `debt` is deliberately absent -- it is total_amount - paid, computed at
    render time by vehicleDebt(). Storing it would let the two drift apart.
  */

  /** Short human-facing number, GENERATED ALWAYS. Display only, never a key. */
  ref_no: number
  location: VehicleLocation | null
  auction_penalty: number
  final_price: number | null

  auction_date: string | null
  auction_house: string | null
  auction_state: string | null
  auction_city: string | null

  loading_port: string | null
  carrier: string | null
  terminal: string | null
  auction_pickup_date: string | null
  warehouse_delivery_date: string | null
  departure_date: string | null
  entry_date: string | null
  open_date: string | null
  release_date: string | null
  expected_opening_date: string | null
}

export interface VehiclePhoto {
  id: string
  vehicle_id: string | null
  url: string | null
  created_at: string
  /** Added in 0013. NOT NULL DEFAULT 'auction', so it is never absent. */
  category: PhotoCategory
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
  /** Added in 0010_adjust_balance.sql. */
  note: string | null
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
  is_read: boolean
  created_at: string
}

/** Row shape returned by the admin_overview_stats() RPC (0011). */
export interface AdminOverviewStats {
  customers: number
  vehicles_total: number
  at_auction: number
  in_transit: number
  at_port: number
  on_ocean: number
  delivered: number
  unread_messages: number
  /** numeric comes back as a string from PostgREST; format, never compute. */
  outstanding: string | number
}

/** Row shape returned by the admin_list_customers() RPC (0011). */
export interface AdminCustomer {
  id: string
  full_name: string | null
  email: string | null
  balance: number | string
  role: UserRole
  created_at: string
  vehicle_count: number
}
