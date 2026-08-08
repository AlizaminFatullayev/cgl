import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * The contact form, lifted out of ContactPage so the Home page's contact
 * section and /contact share one implementation. The schema and the submit
 * handler are carried over unchanged.
 */
/**
 * Validation RULES are unchanged -- only the MESSAGES are translated. Each
 * message is a translation key resolved at render time, so switching language
 * re-labels existing errors without re-running validation.
 */
const contactSchema = z.object({
  name: z.string().trim().min(2, 'vNameMin'),
  email: z.email('vEmail'),
  vin: z.string().trim().max(17, 'vVinMax').optional().or(z.literal('')),
  message: z.string().trim().min(10, 'vMessageMin'),
})

type ContactValues = z.infer<typeof contactSchema>

export function ContactForm({ idPrefix = 'contact' }: { idPrefix?: string }) {
  const { t } = useTranslation(['contact', 'common'])
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', vin: '', message: '' },
  })

  const onSubmit = async (values: ContactValues) => {
    setFormError(null)

    // No .select() here on purpose: contact_messages is insert-for-anyone but
    // select-for-admin-only, so asking for the row back would be refused even
    // though the insert succeeded. An INSERT blocked by RLS always raises an
    // error rather than silently writing nothing, so a null error is a
    // trustworthy success signal for this one table.
    const { error } = await supabase.from('contact_messages').insert({
      name: values.name.trim(),
      email: values.email.trim(),
      vin: values.vin?.trim() ? values.vin.trim().toUpperCase() : null,
      message: values.message.trim(),
    })

    if (error) {
      setFormError(t('errorPrefix', { error: error.message }))
      return
    }

    reset()
    setSent(true)
  }

  // Ids must stay unique when the form is mounted twice on one page.
  const fieldId = (name: string) => `${idPrefix}-${name}`

  if (sent) {
    return (
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <span className="bg-success-soft text-success-strong mb-1 flex size-10 items-center justify-center rounded-xl">
            <CheckCircle2 className="size-5" />
          </span>
          <CardTitle>{t('sentTitle')}</CardTitle>
          <CardDescription>
            {t('sentBody')}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            className="rounded-full px-5"
            onClick={() => setSent(false)}
          >
            {t('sendAnother')}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 shadow-soft">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={fieldId('name')}>{t('name')}</Label>
            <Input
              id={fieldId('name')}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{t(errors.name.message ?? '')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId('email')}>{t('email')}</Label>
            <Input
              id={fieldId('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-destructive text-sm">{t(errors.email.message ?? '')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId('vin')}>
              {t('vin')}{' '}
              <span className="text-muted-foreground">
                ({t('common:optional')})
              </span>
            </Label>
            <Input
              id={fieldId('vin')}
              placeholder="1HGCM82633A004352"
              aria-invalid={Boolean(errors.vin)}
              {...register('vin')}
            />
            {errors.vin && (
              <p className="text-destructive text-sm">{t(errors.vin.message ?? '')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId('message')}>{t('message')}</Label>
            <Textarea
              id={fieldId('message')}
              rows={5}
              aria-invalid={Boolean(errors.message)}
              {...register('message')}
            />
            {errors.message && (
              <p className="text-destructive text-sm">
                {t(errors.message.message ?? '')}
              </p>
            )}
          </div>

          {formError && (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          )}
        </CardContent>

        <CardFooter className="mt-6">
          <Button
            type="submit"
            className="shadow-soft rounded-full px-6"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {t('send')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
