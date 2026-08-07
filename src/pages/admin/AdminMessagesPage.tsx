import { useCallback, useEffect, useState } from 'react'
import { Loader2, Mail, MailOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { updateRowById } from '@/lib/admin-writes'
import { displayText, formatDate } from '@/lib/format'
import type { ContactMessage } from '@/types/database'
import { AdminError } from '@/components/AdminError'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [writeError, setWriteError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: loadError } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<ContactMessage[]>()

    if (loadError) {
      setError(loadError.message)
      setMessages([])
    } else {
      setMessages(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggleRead = async (message: ContactMessage) => {
    setWriteError(null)
    setSavingId(message.id)

    const { data, error: updateError } = await updateRowById<ContactMessage>(
      'contact_messages',
      message.id,
      { is_read: !message.is_read },
    )
    setSavingId(null)

    if (updateError || !data) {
      setWriteError(updateError ?? 'The message was not updated.')
      return
    }
    setMessages((current) =>
      current.map((row) => (row.id === data.id ? data : row)),
    )
  }

  const unreadCount = messages.filter((message) => !message.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        {unreadCount > 0 && <Badge>{unreadCount} unread</Badge>}
      </div>

      {writeError && <AdminError message={writeError} />}
      {error && <AdminError message={`Could not load messages: ${error}`} />}

      {loading ? (
        <div className="flex items-center gap-2 py-10">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
          <span className="text-muted-foreground">Loading messages…</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-10 text-center">
          No messages yet.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={message.is_read ? 'opacity-70' : undefined}
            >
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {message.is_read ? (
                        <MailOpen className="text-muted-foreground size-4" />
                      ) : (
                        <Mail className="size-4" />
                      )}
                      {displayText(message.name, 'Unnamed sender')}
                      {!message.is_read && <Badge>New</Badge>}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {displayText(message.email)}
                      {message.vin?.trim()
                        ? ` · VIN ${message.vin.trim()}`
                        : ''}
                      {` · ${formatDate(message.created_at)}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void toggleRead(message)}
                    disabled={savingId === message.id}
                  >
                    {savingId === message.id && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    {message.is_read ? 'Mark unread' : 'Mark read'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">
                {displayText(message.message, 'No message body.')}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
