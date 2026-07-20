'use client'

import { useState, useTransition } from 'react'
import { Check, X } from 'lucide-react'

import { reviewCorrection } from '../actions'
import { Button } from '@/components/ui/button'
import { LocalTime } from '@/components/ui/local-time'

interface CorrectionItem {
  id: string
  employeeName: string
  date: string
  requestedClockIn: string | null
  requestedClockOut: string | null
  reason: string
}

export function CorrectionsQueue({ corrections }: { corrections: CorrectionItem[] }) {
  return (
    <div className="bg-card rounded-xl border p-6">
      <h2 className="mb-4 text-lg font-semibold">
        Pending corrections
        {corrections.length > 0 ? (
          <span className="text-muted-foreground ml-2 text-sm font-normal">
            ({corrections.length})
          </span>
        ) : null}
      </h2>

      {corrections.length === 0 ? (
        <p className="text-muted-foreground text-sm">No correction requests to review.</p>
      ) : (
        <ul className="divide-y">
          {corrections.map((correction) => (
            <CorrectionRow key={correction.id} correction={correction} />
          ))}
        </ul>
      )}
    </div>
  )
}

function CorrectionRow({ correction }: { correction: CorrectionItem }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function review(approve: boolean) {
    setError(null)

    let rejectionReason: string | undefined
    if (!approve) {
      rejectionReason = window.prompt('Reason for rejection (optional):') ?? undefined
    }

    startTransition(async () => {
      try {
        await reviewCorrection(correction.id, approve, rejectionReason)
      } catch (reviewError) {
        setError(reviewError instanceof Error ? reviewError.message : 'Review failed.')
      }
    })
  }

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">
          {correction.employeeName}{' '}
          <span className="text-muted-foreground">
            · <LocalTime iso={correction.date} mode="date" />
          </span>
        </p>
        <p className="text-muted-foreground text-sm">
          Requested: <LocalTime iso={correction.requestedClockIn} mode="time" /> –{' '}
          <LocalTime iso={correction.requestedClockOut} mode="time" />
        </p>
        <p className="mt-1 text-sm">{correction.reason}</p>
        {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => review(true)}
          className="gap-1 text-green-700"
        >
          <Check className="h-4 w-4" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => review(false)}
          className="gap-1 text-red-600"
        >
          <X className="h-4 w-4" />
          Reject
        </Button>
      </div>
    </li>
  )
}
