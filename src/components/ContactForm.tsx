import { useState } from 'react'
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
const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.email('Enter a valid email address'),
  vin: z
    .string()
    .trim()
    .max(17, 'A VIN is at most 17 characters')
    .optional()
    .or(z.literal('')),
  message: z.string().trim().min(10, 'Tell us a bit more (10+ characters)'),
})

type ContactValues = z.infer<typeof contactSchema>

export function ContactForm({ idPrefix = 'contact' }: { idPrefix?: string }) {
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
      setFormError(
        `We could not send your message: ${error.message}. Please try again.`,
      )
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
          <CardTitle>Message sent</CardTitle>
          <CardDescription>
            Thanks — we have your message and will get back to you by email.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            className="rounded-full px-5"
            onClick={() => setSent(false)}
          >
            Send another message
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
            <Label htmlFor={fieldId('name')}>Name</Label>
            <Input
              id={fieldId('name')}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId('email')}>Email</Label>
            <Input
              id={fieldId('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId('vin')}>
              VIN <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={fieldId('vin')}
              placeholder="1HGCM82633A004352"
              aria-invalid={Boolean(errors.vin)}
              {...register('vin')}
            />
            {errors.vin && (
              <p className="text-destructive text-sm">{errors.vin.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={fieldId('message')}>Message</Label>
            <Textarea
              id={fieldId('message')}
              rows={5}
              aria-invalid={Boolean(errors.message)}
              {...register('message')}
            />
            {errors.message && (
              <p className="text-destructive text-sm">
                {errors.message.message}
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
            Send Message
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
