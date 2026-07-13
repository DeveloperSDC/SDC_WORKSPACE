'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'

import type { MilestoneStatus } from '@prisma/client'
import { createMilestone, updateMilestoneStatus } from '../../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Milestone {
  id: string
  title: string
  description: string | null
  dueDate: string
  status: MilestoneStatus
}

const STATUSES: { value: MilestoneStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'MISSED', label: 'Missed' },
]

const STATUS_STYLES: Record<MilestoneStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  MISSED: 'bg-red-100 text-red-700 border-red-200',
}

export function MilestonesManager({
  projectId,
  canManage,
  milestones,
}: {
  projectId: string
  canManage: boolean
  milestones: Milestone[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function add(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createMilestone({
          projectId,
          title: formData.get('title') as string,
          dueDate: formData.get('dueDate') as string,
          description: (formData.get('description') as string) || undefined,
        })
      } catch (addError) {
        setError(addError instanceof Error ? addError.message : 'Failed to add milestone.')
      }
    })
  }

  function changeStatus(milestoneId: string, status: MilestoneStatus) {
    setError(null)
    startTransition(async () => {
      try {
        await updateMilestoneStatus(milestoneId, status)
      } catch (statusError) {
        setError(statusError instanceof Error ? statusError.message : 'Update failed.')
      }
    })
  }

  return (
    <div className="bg-card rounded-xl border p-6">
      <h2 className="mb-4 text-lg font-semibold">Milestones ({milestones.length})</h2>

      {milestones.length === 0 ? (
        <p className="text-muted-foreground text-sm">No milestones yet.</p>
      ) : (
        <ul className="divide-y">
          {milestones.map((milestone) => (
            <li key={milestone.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{milestone.title}</p>
                <p className="text-muted-foreground text-xs">Due {milestone.dueDate}</p>
              </div>

              {canManage ? (
                <select
                  value={milestone.status}
                  disabled={pending}
                  onChange={(event) =>
                    changeStatus(milestone.id, event.target.value as MilestoneStatus)
                  }
                  className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                >
                  {STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Badge variant="outline" className={STATUS_STYLES[milestone.status]}>
                  {STATUSES.find((s) => s.value === milestone.status)?.label}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <form action={add} className="mt-4 flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <Input name="title" placeholder="Milestone title" required />
          </div>
          <Input name="dueDate" type="date" required className="w-40" />
          <Button type="submit" disabled={pending} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
