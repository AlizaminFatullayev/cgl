import { supabase } from '@/lib/supabase'

/**
 * Typed wrapper around supabase.rpc().
 *
 * The client is constructed without a generated Database type, so rpc() has
 * no idea what any given function returns and its inferred type fights every
 * assignment. One cast lives here instead of at each call site; the shapes it
 * is cast to are declared in src/types/database.ts and must stay in step with
 * the SQL in supabase/migrations.
 */
export async function callRpc<T>(
  fn: string,
  args?: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) return { data: null, error: error.message }
  return { data: data as T, error: null }
}
