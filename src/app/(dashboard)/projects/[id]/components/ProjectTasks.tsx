'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import type { TaskPriority, TaskStatus } from '@prisma/client'
import { createTask, updateTaskStatus } from '@/app/(dashboard)/tasks/actions'
import { TaskPriorityBadge } from '@/app/(dashboard)/tasks/components/TaskPriorityBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface ProjectTaskItem {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  assigneeId: string | null
  assigneeName: string | null
}

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DONE', label: 'Done' },
]

const selectClass = 'border-input bg-background h-10 rounded-md border px-3 text-sm'

export function ProjectTasks({
  projectId,
  canManageTasks,
  currentEmployeeId,
  tasks,
  members,
}: {
  projectId: string
  /** Admin or the project manager — may create tasks and change any task's status. */
  canManageTasks: boolean
  currentEmployeeId: string | null
  tasks: ProjectTaskItem[]
  members: { id: string; name: string }[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function add(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createTask({
          title: formData.get('title') as string,
          priority: formData.get('priority') as TaskPriority,
          dueDate: (formData.get('dueDate') as string) || undefined,
          assigneeId: (formData.get('assigneeId') as string) || undefined,
          projectId,
        })
      } catch (addError) {
        setError(addError instanceof Error ? addError.message : 'Failed to create task.')
      }
    })
  }

  function move(taskId: string, status: TaskStatus) {
    setError(null)
    startTransition(async () => {
      try {
        await updateTaskStatus(taskId, status)
      } catch (moveError) {
        setError(moveError instanceof Error ? moveError.message : 'Update failed.')
      }
    })
  }

  return (
    <div className="bg-card rounded-xl border p-6 lg:col-span-2">
      <h2 className="mb-4 text-lg font-semibold">Tasks ({tasks.length})</h2>

      {tasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">No tasks in this project yet.</p>
      ) : (
        <ul className="divide-y">
          {tasks.map((task) => {
            const canEditStatus =
              canManageTasks || (currentEmployeeId != null && task.assigneeId === currentEmployeeId)

            return (
              <li key={task.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {task.title}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    {task.assigneeName ? `Assigned to ${task.assigneeName}` : 'Unassigned'}
                    {task.dueDate ? ` · Due ${task.dueDate}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <TaskPriorityBadge priority={task.priority} />

                  {canEditStatus ? (
                    <select
                      value={task.status}
                      disabled={pending}
                      onChange={(event) => move(task.id, event.target.value as TaskStatus)}
                      className="border-input bg-background h-8 rounded-md border px-2 text-xs"
                    >
                      {STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {STATUSES.find((s) => s.value === task.status)?.label}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {canManageTasks ? (
        <form action={add} className="mt-4 flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <Input name="title" placeholder="Task title" required />
          </div>

          <select name="assigneeId" defaultValue="" className={selectClass}>
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>

          <select name="priority" defaultValue="MEDIUM" className={selectClass}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority.charAt(0) + priority.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          <Input name="dueDate" type="date" className="w-40" />

          <Button type="submit" disabled={pending} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Assign
          </Button>
        </form>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
