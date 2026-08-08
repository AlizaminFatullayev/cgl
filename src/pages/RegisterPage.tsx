import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'vFullName'),
  email: z.email('vEmail'),
  password: z.string().min(8, 'vPasswordMin'),
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { t } = useTranslation('auth')
  const { session, loading, signUp } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  })

  if (loading) return <FullPageLoader />

  if (session) return <Navigate to="/dashboard" replace />

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null)
    const { error } = await signUp(
      values.fullName,
      values.email,
      values.password,
    )
    if (error) {
      setFormError(error)
      return
    }
    // With email confirmation disabled Supabase returns a session, the auth
    // listener picks it up, and the <Navigate> above redirects to /dashboard.
    // With confirmation enabled there is no session yet, so fall through to
    // the "check your inbox" panel instead.
    setNeedsConfirmation(true)
  }

  if (needsConfirmation && !session) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{t('checkEmailTitle')}</CardTitle>
            <CardDescription>{t('checkEmailBody')}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link
              to="/login"
              className={cn(buttonVariants(), 'w-full')}
            >
              {t('goToSignIn')}
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('registerTitle')}</CardTitle>
          <CardDescription>{t('registerSubtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('fullName')}</Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                aria-invalid={Boolean(errors.fullName)}
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-destructive text-sm">
                  {t(errors.fullName.message ?? '')}
                </p>
              )}
            </div>

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
                autoComplete="new-password"
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
              {t('createAccount')}
            </Button>
            <p className="text-muted-foreground text-sm">
              {t('alreadyRegistered')}{' '}
              <Link to="/login" className="text-foreground underline">
                {t('signInTitle')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
