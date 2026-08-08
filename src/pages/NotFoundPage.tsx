import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation('common')

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">{t('pageNotFound')}</h1>
      <Link to="/dashboard" className={buttonVariants({ variant: 'outline' })}>
        {t('backToDashboard')}
      </Link>
    </div>
  )
}
