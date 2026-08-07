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

export function ContactPage() {
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

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Contact us</h1>
        <p className="text-muted-foreground max-w-2xl">
          Send us a question about a shipment or a vehicle you are planning to
          buy. Include the VIN if you already have one.
        </p>
      </header>

      {sent ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CheckCircle2 className="size-5" />
            <CardTitle>Message sent</CardTitle>
            <CardDescription>
              Thanks — we have your message and will get back to you by email.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => setSent(false)}>
              Send another message
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="max-w-xl">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-destructive text-sm">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">
                  VIN <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="vin"
                  placeholder="1HGCM82633A004352"
                  aria-invalid={Boolean(errors.vin)}
                  {...register('vin')}
                />
                {errors.vin && (
                  <p className="text-destructive text-sm">
                    {errors.vin.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Send message
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}
