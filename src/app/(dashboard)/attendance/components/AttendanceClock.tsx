'use client'

import { useState, useTransition } from 'react'
import { LogIn, LogOut } from 'lucide-react'

import { checkIn, checkOut } from '../actions'
import { Button } from '@/components/ui/button'

interface AttendanceClockProps {
  hasCheckedIn: boolean
  hasCheckedOut: boolean
}

export function AttendanceClock({ hasCheckedIn, hasCheckedOut }: AttendanceClockProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(action: () => Promise<void>) {
    setError(null)
    startTransition(async () => {
      try {
        await action()
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : 'Something went wrong.')
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex gap-2">
        <Button onClick={() => run(checkIn)} disabled={pending || hasCheckedIn} className="gap-2">
          <LogIn className="h-4 w-4" />
          Check in
        </Button>

        <Button
          variant="outline"
          onClick={() => run(checkOut)}
          disabled={pending || !hasCheckedIn || hasCheckedOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Check out
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
