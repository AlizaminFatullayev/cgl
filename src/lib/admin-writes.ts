/**
 * Write helpers that refuse to treat "no error" as success.
 *
 * RLS denies an UPDATE by filtering the rows it applies to, not by raising:
 * a blocked update comes back with error === null and zero rows changed.
 * Every admin write therefore asks PostgREST to return the affected rows and
 * checks that at least one came back.
 */
import { supabase } from '@/lib/supabase'

export interface WriteResult<T> {
  data: T | null
  error: string | null
}

const BLOCKED_MESSAGE =
  'The change was not saved. The database rejected it — your session may no ' +
  'longer have admin rights. Reload and try again.'

/**
 * Updates one row by id and confirms a row actually came back.
 *
 * `.select()` after `.update()` returns exactly the rows the write touched,
 * so an empty result is the silent-RLS case.
 */
export async function updateRowById<T>(
  table: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<WriteResult<T>> {
  const { data, error } = await supabase
    .from(table)
    .update(patch)
    .eq('id', id)
    .select()

  if (error) return { data: null, error: error.message }
  if (!data || data.length === 0) {
    return { data: null, error: BLOCKED_MESSAGE }
  }
  return { data: data[0] as T, error: null }
}

/** Inserts one row and confirms the inserted row came back. */
export async function insertRow<T>(
  table: string,
  values: Record<string, unknown>,
): Promise<WriteResult<T>> {
  const { data, error } = await supabase.from(table).insert(values).select()

  if (error) return { data: null, error: error.message }
  if (!data || data.length === 0) {
    return {
      data: null,
      error:
        'The record was not created. The database rejected the insert — ' +
        'your session may no longer have admin rights.',
    }
  }
  return { data: data[0] as T, error: null }
}

/**
 * Deletes one row by id and confirms something was actually removed.
 *
 * A delete blocked by RLS is the quietest failure of all: no error, and the
 * row is still there on the next refresh.
 */
export async function deleteRowById(
  table: string,
  id: string,
): Promise<WriteResult<{ id: string }>> {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .select('id')

  if (error) return { data: null, error: error.message }
  if (!data || data.length === 0) {
    return {
      data: null,
      error:
        'Nothing was deleted. The database rejected the delete — your ' +
        'session may no longer have admin rights.',
    }
  }
  return { data: data[0] as { id: string }, error: null }
}
