'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import type { TaskPriority } from '@prisma/client'
import { createTask } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const selectClass =
  'border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm'

export function CreateTaskDialog({ employees }: { employees: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
      await createTask({
        title: formData.get('title') as string,
        description: (formData.get('description') as string) || undefined,
        priority: formData.get('priority') as TaskPriority,
        dueDate: (formData.get('dueDate') as string) || undefined,
        assigneeIds: formData.getAll('assigneeIds') as string[],
      })

      setOpen(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create task.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>Create a task and optionally assign it.</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Design login screen" required />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" name="priority" defaultValue="MEDIUM" className={selectClass}>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0) + priority.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
          </div>

          <div>
            <Label htmlFor="assigneeIds">Assignees</Label>
            <select
              id="assigneeIds"
              name="assigneeIds"
              multiple
              size={Math.min(5, Math.max(3, employees.length))}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground mt-1 text-xs">
              Hold Ctrl / Cmd to select multiple. Leave empty for unassigned.
            </p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
