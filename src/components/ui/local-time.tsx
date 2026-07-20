'use client'

import { useEffect, useState } from 'react'

type Mode = 'date' | 'time' | 'datetime'

const OPTIONS: Record<Mode, Intl.DateTimeFormatOptions> = {
  date: { day: '2-digit', month: 'short', year: 'numeric' },
  time: { hour: '2-digit', minute: '2-digit' },
  datetime: { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' },
}

/**
 * Renders a timestamp in the VIEWER's local timezone & locale.
 * `iso` is a UTC/ISO string from the server; formatting happens on the client
 * so it always matches the user's device time (not the server's UTC).
 */
export function LocalTime({
  iso,
  mode = 'datetime',
  placeholder = '—',
}: {
  iso: string | null
  mode?: Mode
  placeholder?: string
}) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (!iso) {
      setText(placeholder)
      return
    }
    setText(new Intl.DateTimeFormat(undefined, OPTIONS[mode]).format(new Date(iso)))
  }, [iso, mode, placeholder])

  // Empty on first paint, filled after hydration → avoids server/client mismatch.
  return <span suppressHydrationWarning>{text || (iso ? '…' : placeholder)}</span>
}
