'use client'

import { useState, useTransition } from 'react'

import type { TaskStatus } from '@prisma/client'
import { updateTaskStatus } from '../../actions'
import { Badge } from '@/components/ui/badge'

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DONE', label: 'Done' },
]

export function TaskStatusControl({
  taskId,
  status,
  canEdit,
}: {
  taskId: string
  status: TaskStatus
  canEdit: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function change(next: TaskStatus) {
    setError(null)
    startTransition(async () => {
      try {
        await updateTaskStatus(taskId, next)
      } catch (changeError) {
        setError(changeError instanceof Error ? changeError.message : 'Update failed.')
      }
    })
  }

  if (!canEdit) {
    return <Badge variant="outline">{STATUSES.find((s) => s.value === status)?.label}</Badge>
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <select
        value={status}
        disabled={pending}
        onChange={(event) => change(event.target.value as TaskStatus)}
        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
      >
        {STATUSES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
