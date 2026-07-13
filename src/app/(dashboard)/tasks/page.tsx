import type { Metadata } from 'next'

import { db } from '@/lib/db/prisma'
import { requireAuth, hasPermission } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { PageHeader } from '@/components/layout/page-header'
import { TaskBoard, type TaskCard } from './components/TaskBoard'
import { CreateTaskDialog } from './components/CreateTaskDialog'

export const metadata: Metadata = {
  title: 'Tasks',
}

export default async function TasksPage() {
  const user = await requireAuth()
  const canReadAll = hasPermission(user, PERMISSIONS.TASKS_READ_ALL)
  const canCreate = hasPermission(user, PERMISSIONS.TASKS_CREATE_OWN)

  if (!user.employeeId && !canReadAll) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="Tasks" description="Track and assign work." />
        <p className="text-muted-foreground text-sm">
          Your account is not linked to an employee record, so tasks are unavailable.
        </p>
      </div>
    )
  }

  const employeeId = user.employeeId

  const [tasks, employees] = await Promise.all([
    db.task.findMany({
      where: {
        isDeleted: false,
        ...(canReadAll || !employeeId
          ? {}
          : {
              OR: [{ reporterId: employeeId }, { assigneeId: employeeId }],
            }),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        assignee: { include: { user: { select: { name: true } } } },
      },
    }),

    db.employee.findMany({
      where: { isDeleted: false, status: 'ACTIVE' },
      orderBy: { user: { name: 'asc' } },
      select: { id: true, user: { select: { name: true } } },
    }),
  ])

  const cards: TaskCard[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate
      ? task.dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      : null,
    assigneeId: task.assigneeId,
    assigneeName: task.assignee?.user.name ?? null,
  }))

  const employeeOptions = employees.map((employee) => ({
    id: employee.id,
    name: employee.user.name,
  }))

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Tasks"
        description="Track and assign work across the team."
        actions={canCreate ? <CreateTaskDialog employees={employeeOptions} /> : undefined}
      />

      <TaskBoard tasks={cards} employees={employeeOptions} />
    </div>
  )
}
