'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'

import type { TaskPriority, TaskStatus } from '@prisma/client'
import { deleteTask, updateTaskStatus } from '../actions'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import { Button } from '@/components/ui/button'

export interface TaskCard {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  assigneeId: string | null
  assigneeName: string | null
}

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DONE', label: 'Done' },
]

export function TaskBoard({
  tasks,
}: {
  tasks: TaskCard[]
  employees: { id: string; name: string }[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {STATUSES.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.value)

        return (
          <div key={column.value} className="bg-muted/40 flex flex-col gap-3 rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{column.label}</h3>
              <span className="text-muted-foreground text-xs">{columnTasks.length}</span>
            </div>

            {columnTasks.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-xs">No tasks</p>
            ) : (
              columnTasks.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        )
      })}
    </div>
  )
}

function TaskItem({ task }: { task: TaskCard }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function move(status: TaskStatus) {
    setError(null)
    startTransition(async () => {
      try {
        await updateTaskStatus(task.id, status)
      } catch (moveError) {
        setError(moveError instanceof Error ? moveError.message : 'Update failed.')
      }
    })
  }

  function remove() {
    if (!window.confirm(`Delete task "${task.title}"?`)) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteTask(task.id)
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Delete failed.')
      }
    })
  }

  return (
    <div className="bg-card rounded-lg border p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/tasks/${task.id}`} className="text-sm font-medium hover:underline">
          {task.title}
        </Link>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          onClick={remove}
          aria-label="Delete task"
          className="text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {task.description ? (
        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{task.description}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <TaskPriorityBadge priority={task.priority} />
        {task.dueDate ? (
          <span className="text-muted-foreground text-xs">Due {task.dueDate}</span>
        ) : null}
      </div>

      <p className="text-muted-foreground mt-2 text-xs">
        {task.assigneeName ? `Assigned to ${task.assigneeName}` : 'Unassigned'}
      </p>

      <select
        value={task.status}
        disabled={pending}
        onChange={(event) => move(event.target.value as TaskStatus)}
        className="border-input bg-background mt-2 h-8 w-full rounded-md border px-2 text-xs"
      >
        {STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
