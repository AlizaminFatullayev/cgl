/**
 * notify-contact-message
 *
 * Emails a notification when a row is inserted into public.contact_messages.
 * Fired by a Supabase Database Webhook (Database -> Webhooks) on INSERT.
 *
 * ============================ DESIGN NOTES ============================
 * The database row is the source of truth. It is already committed by the
 * time this function runs, and /admin/messages reads it regardless of what
 * happens here. Email is strictly an addition: nothing in this file can fail
 * a customer's form submission.
 *
 * Consequently:
 *   - a missing RESEND_API_KEY is NOT an error. The function logs and returns
 *     200 so the webhook is not retried forever over a config gap.
 *   - a provider failure IS an error. It returns non-2xx so Supabase retries
 *     and the failure is visible in the function logs.
 *
 * SECURITY: this endpoint is publicly reachable. Every request must carry the
 * shared secret in x-webhook-secret or it is rejected before any mail is sent.
 * Deploy with --no-verify-jwt (see README): the shared secret, not a JWT, is
 * the guard, and it is compared in constant time.
 *
 * CONFIGURATION -- no secrets and no addresses are hardcoded. All of these are
 * Supabase function secrets, set with `npx supabase secrets set`:
 *   RESEND_API_KEY          required to actually send; absent => clean no-op
 *   CONTACT_WEBHOOK_SECRET  required; requests without it are rejected
 *   CONTACT_TO_EMAIL        optional, defaults below
 *   CONTACT_FROM_EMAIL      optional, defaults to Resend's shared sender
 * =====================================================================
 */

const DEFAULT_TO = 'caspiangloballogistics@gmail.com'

/**
 * Resend's shared sender. It works with no verified domain, but ONLY delivers
 * to the address that owns the Resend account. Once the client verifies a real
 * domain, set CONTACT_FROM_EMAIL to something like
 * "CGL <noreply@caspiangloballogistics.com>" -- no code change needed.
 */
const DEFAULT_FROM = 'CGL Website <onboarding@resend.dev>'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** Shape Supabase Database Webhooks POST for a row change. */
interface WebhookPayload {
  type?: string
  table?: string
  schema?: string
  record?: Record<string, unknown> | null
}

/** The columns we read off contact_messages. */
interface ContactRecord {
  id?: string
  name?: string | null
  email?: string | null
  vin?: string | null
  message?: string | null
  created_at?: string | null
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Constant-time string comparison. A plain === leaks the length of the
 * matching prefix through timing, which is exactly what a caller probing this
 * public endpoint would measure.
 */
function secretsMatch(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const bufA = enc.encode(a)
  const bufB = enc.encode(b)
  if (bufA.length !== bufB.length) return false
  let diff = 0
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i]
  return diff === 0
}

/** name, message and VIN are attacker-controlled -- never interpolate raw. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function orDash(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  return trimmed === '' ? '—' : trimmed
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  // UTC keeps the log unambiguous regardless of where it is read.
  return `${date.toISOString().replace('T', ' ').slice(0, 19)} UTC`
}

/** Rough sanity check so a malformed row cannot poison the Reply-To header. */
function isPlausibleEmail(value: string): boolean {
  return /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value)
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // --- 1. Authenticate the caller before doing anything else --------------
  const expectedSecret = Deno.env.get('CONTACT_WEBHOOK_SECRET') ?? ''
  if (expectedSecret === '') {
    // Fail closed: without a configured secret we cannot tell the webhook
    // apart from an arbitrary caller, so we refuse rather than send mail.
    console.error(
      'CONTACT_WEBHOOK_SECRET is not set — refusing to process. ' +
        'Set it with: npx supabase secrets set CONTACT_WEBHOOK_SECRET=...',
    )
    return json({ error: 'Not configured' }, 500)
  }

  const providedSecret = req.headers.get('x-webhook-secret') ?? ''
  if (!secretsMatch(providedSecret, expectedSecret)) {
    console.warn('Rejected a request with a missing or incorrect webhook secret')
    return json({ error: 'Unauthorized' }, 401)
  }

  // --- 2. Parse and validate the payload ----------------------------------
  let payload: WebhookPayload
  try {
    payload = (await req.json()) as WebhookPayload
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (payload.type !== 'INSERT' || payload.table !== 'contact_messages') {
    // Not our event. Acknowledge so the webhook is not retried.
    console.log(
      `Ignoring event type=${payload.type} table=${payload.table}`,
    )
    return json({ ignored: true }, 200)
  }

  const record = (payload.record ?? {}) as ContactRecord
  if (!record.id) {
    console.error('INSERT payload had no record.id — nothing to notify about')
    return json({ error: 'Malformed record' }, 400)
  }

  // --- 3. No API key => clean no-op, never a crash ------------------------
  const apiKey = Deno.env.get('RESEND_API_KEY') ?? ''
  if (apiKey === '') {
    console.log(
      `RESEND_API_KEY is not set — skipping email for contact_messages.id=${record.id}. ` +
        'The row is saved and visible at /admin/messages. ' +
        'Set the key with: npx supabase secrets set RESEND_API_KEY=...',
    )
    return json({ skipped: 'RESEND_API_KEY not configured' }, 200)
  }

  // --- 4. Build the message ----------------------------------------------
  const to = Deno.env.get('CONTACT_TO_EMAIL') ?? DEFAULT_TO
  const from = Deno.env.get('CONTACT_FROM_EMAIL') ?? DEFAULT_FROM

  const name = orDash(record.name)
  const email = orDash(record.email)
  const vin = orDash(record.vin)
  const message = orDash(record.message)
  const submitted = formatTimestamp(record.created_at)

  const subject = `New contact message from ${name}`

  const text = [
    `Name:      ${name}`,
    `Email:     ${email}`,
    `VIN:       ${vin}`,
    `Submitted: ${submitted}`,
    '',
    'Message:',
    message,
  ].join('\n')

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.5;color:#031222">
      <h2 style="margin:0 0 16px;font-size:18px">New contact message</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 16px 4px 0;color:#5c6b7a">Name</td><td style="padding:4px 0"><strong>${escapeHtml(name)}</strong></td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#5c6b7a">Email</td><td style="padding:4px 0">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#5c6b7a">VIN</td><td style="padding:4px 0">${escapeHtml(vin)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#5c6b7a">Submitted</td><td style="padding:4px 0">${escapeHtml(submitted)}</td></tr>
      </table>
      <p style="margin:16px 0 4px;color:#5c6b7a;font-size:14px">Message</p>
      <div style="white-space:pre-wrap;padding:12px;border:1px solid #dee6ec;border-radius:8px;font-size:14px">${escapeHtml(message)}</div>
    </div>
  `.trim()

  const body: Record<string, unknown> = {
    from,
    to: [to],
    subject,
    text,
    html,
  }

  // Reply goes straight back to the submitter, but only if the stored address
  // actually looks like one -- a junk value here would break the header.
  if (isPlausibleEmail(email)) {
    body.reply_to = email
  }

  // --- 5. Send, and surface provider failures as non-2xx ------------------
  let response: Response
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    console.error(
      `Could not reach the email provider for contact_messages.id=${record.id}:`,
      error,
    )
    return json({ error: 'Email provider unreachable' }, 502)
  }

  if (!response.ok) {
    // Read the provider's reason so the log is actionable -- an unverified
    // sending domain shows up here as a 403.
    const detail = await response.text()
    console.error(
      `Email provider returned ${response.status} for contact_messages.id=${record.id}: ${detail}`,
    )
    return json({ error: 'Email provider rejected the message' }, 502)
  }

  console.log(`Notification sent for contact_messages.id=${record.id}`)
  return json({ sent: true }, 200)
})
