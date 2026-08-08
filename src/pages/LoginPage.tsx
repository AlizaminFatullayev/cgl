import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FullPageLoader } from '@/components/FullPageLoader'

/** Validation RULES unchanged; only the MESSAGES are translation keys. */
const loginSchema = z.object({
  email: z.email('vEmail'),
  password: z.string().min(1, 'vPasswordRequired'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { t } = useTranslation('auth')
  const { session, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (loading) return <FullPageLoader />

  if (session) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/dashboard'} replace />
  }

  const onSubmit = async (values: LoginValues) => {
    setFormError(null)
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setFormError(error)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('signInTitle')}</CardTitle>
          <CardDescription>{t('signInSubtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-destructive text-sm">
                  {t(errors.email.message ?? '')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-destructive text-sm">
                  {t(errors.password.message ?? '')}
                </p>
              )}
            </div>

            {formError && (
              <p role="alert" className="text-destructive text-sm">
                {formError}
              </p>
            )}
          </CardContent>

          <CardFooter className="mt-6 flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t('signInTitle')}
            </Button>
            <p className="text-muted-foreground text-sm">
              {t('noAccount')}{' '}
              <Link to="/register" className="text-foreground underline">
                {t('registerTitle')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
