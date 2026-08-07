import { AlertTriangle } from 'lucide-react'

/** Consistent, loud failure banner for every admin screen. */
export function AdminError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-3 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
