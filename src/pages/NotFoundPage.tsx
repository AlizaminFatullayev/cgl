import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/dashboard" className={buttonVariants({ variant: 'outline' })}>
        Back to dashboard
      </Link>
    </div>
  )
}
