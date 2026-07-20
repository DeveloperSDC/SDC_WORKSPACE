import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { db } from '@/lib/db/prisma'
import { requireAuth, hasPermission } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { Button } from '@/components/ui/button'
import { TaskPriorityBadge } from '../components/TaskPriorityBadge'
import { TaskStatusControl } from './components/TaskStatusControl'
import { TaskComments, type TaskCommentItem } from './components/TaskComments'
import { LocalTime } from '@/components/ui/local-time'

export const metadata: Metadata = {
  title: 'Task',
}

interface TaskPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: TaskPageProps) {
  const { id } = await params
  const user = await requireAuth()

  const task = await db.task.findFirst({
    where: { id, isDeleted: false },
    include: {
      assignees: { include: { employee: { include: { user: { select: { name: true } } } } } },
      reporter: { include: { user: { select: { name: true } } } },
      project: { select: { id: true, name: true } },
    },
  })

  if (!task) {
    notFound()
  }

  // View access: read-all, own it, or belong to its project.
  const canReadAll = hasPermission(user, PERMISSIONS.TASKS_READ_ALL)
  const owns =
    task.reporterId === user.employeeId ||
    task.assignees.some((a) => a.employeeId === user.employeeId)

  let canView = canReadAll || owns
  if (!canView && task.projectId && user.employeeId) {
    const member = await db.projectMember.findUnique({
      where: {
        projectId_employeeId: { projectId: task.projectId, employeeId: user.employeeId },
      },
      select: { employeeId: true },
    })
    canView = Boolean(member)
  }

  if (!canView) {
    notFound()
  }

  const canEditStatus = hasPermission(user, PERMISSIONS.TASKS_UPDATE_ALL) || owns

  const rawComments = await db.taskComment.findMany({
    where: { taskId: task.id, isDeleted: false },
    orderBy: { createdAt: 'asc' },
  })

  const authorIds = [...new Set(rawComments.map((c) => c.authorId))]
  const authors = await db.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true },
  })
  const authorName = new Map(authors.map((a) => [a.id, a.name]))

  const comments: TaskCommentItem[] = rawComments.map((comment) => ({
    id: comment.id,
    author: authorName.get(comment.authorId) ?? 'Unknown',
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  }))

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to tasks"
          nativeButton={false}
          render={<Link href="/tasks" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-2 text-sm font-semibold">Description</h2>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {task.description || 'No description provided.'}
            </p>
          </div>

          <TaskComments taskId={task.id} comments={comments} />
        </div>

        <div className="bg-card flex h-fit flex-col gap-4 rounded-xl border p-6">
          <div>
            <p className="text-muted-foreground text-xs">Status</p>
            <div className="mt-1">
              <TaskStatusControl taskId={task.id} status={task.status} canEdit={canEditStatus} />
            </div>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">Priority</p>
            <div className="mt-1">
              <TaskPriorityBadge priority={task.priority} />
            </div>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">Assignees</p>
            <p className="mt-1 text-sm">
              {task.assignees.length > 0
                ? task.assignees.map((a) => a.employee.user.name).join(', ')
                : 'Unassigned'}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">Reporter</p>
            <p className="mt-1 text-sm">{task.reporter.user.name}</p>
          </div>

          {task.project ? (
            <div>
              <p className="text-muted-foreground text-xs">Project</p>
              <Link
                href={`/projects/${task.project.id}`}
                className="mt-1 block text-sm hover:underline"
              >
                {task.project.name}
              </Link>
            </div>
          ) : null}

          {task.dueDate ? (
            <div>
              <p className="text-muted-foreground text-xs">Due</p>
              <p className="mt-1 text-sm">
                <LocalTime iso={task.dueDate.toISOString()} mode="date" />
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
