'use server'

import { revalidatePath } from 'next/cache'

import type { TaskPriority, TaskStatus } from '@prisma/client'
import { db } from '@/lib/db/prisma'
import { requireAuth, requirePermission, hasPermission, type SessionUser } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { BusinessRuleError, ForbiddenError, NotFoundError } from '@/lib/errors/app.error'

/** Selection that lets us evaluate ownership across all assignees. */
const OWNERSHIP_SELECT = {
  id: true,
  reporterId: true,
  projectId: true,
  assignees: { select: { employeeId: true } },
} as const

type OwnableTask = {
  reporterId: string
  projectId?: string | null
  assignees: { employeeId: string }[]
}

async function currentEmployeeId(user: SessionUser): Promise<string> {
  if (!user.employeeId) {
    throw new ForbiddenError('Your account is not linked to an employee record.')
  }
  return user.employeeId
}

/** True if the user reports or is one of the task's assignees. */
function isOwner(user: SessionUser, task: OwnableTask): boolean {
  if (!user.employeeId) return false
  if (task.reporterId === user.employeeId) return true
  return task.assignees.some((a) => a.employeeId === user.employeeId)
}

/** A user may manage a task if they can manage all tasks, or own it. */
function assertCanManage(user: SessionUser, task: OwnableTask) {
  if (hasPermission(user, PERMISSIONS.TASKS_UPDATE_ALL)) return
  if (isOwner(user, task) && hasPermission(user, PERMISSIONS.TASKS_UPDATE_OWN)) return
  throw new ForbiddenError('You cannot modify this task.')
}

function normalizeAssignees(ids: string[] | undefined): string[] {
  return [...new Set((ids ?? []).filter(Boolean))]
}

interface CreateTaskInput {
  title: string
  description?: string
  priority: TaskPriority
  dueDate?: string
  assigneeIds?: string[]
  projectId?: string
}

export async function createTask(data: CreateTaskInput) {
  const user = await requirePermission(PERMISSIONS.TASKS_CREATE_OWN)
  const reporterId = await currentEmployeeId(user)

  if (!data.title.trim()) {
    throw new BusinessRuleError('A task title is required.')
  }

  const assigneeIds = normalizeAssignees(data.assigneeIds)

  await db.task.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      // Keep the single `assigneeId` in sync as the "primary" assignee.
      assigneeId: assigneeIds[0] ?? null,
      projectId: data.projectId || null,
      reporterId,
      createdById: user.id,
      assignees: { create: assigneeIds.map((employeeId) => ({ employeeId })) },
    },
  })

  revalidatePath('/tasks')
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const user = await requireAuth()

  const task = await db.task.findFirst({
    where: { id: taskId, isDeleted: false },
    select: OWNERSHIP_SELECT,
  })

  if (!task) {
    throw new NotFoundError('Task')
  }

  assertCanManage(user, task)

  await db.task.update({
    where: { id: task.id },
    data: { status, updatedById: user.id },
  })

  revalidatePath('/tasks')
}

interface UpdateTaskInput {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  dueDate?: string
  assigneeIds?: string[]
}

export async function updateTask(data: UpdateTaskInput) {
  const user = await requireAuth()

  const task = await db.task.findFirst({
    where: { id: data.id, isDeleted: false },
    select: OWNERSHIP_SELECT,
  })

  if (!task) {
    throw new NotFoundError('Task')
  }

  assertCanManage(user, task)

  if (!data.title.trim()) {
    throw new BusinessRuleError('A task title is required.')
  }

  const assigneeIds = normalizeAssignees(data.assigneeIds)

  await db.$transaction(async (tx) => {
    await tx.taskAssignee.deleteMany({ where: { taskId: task.id } })

    await tx.task.update({
      where: { id: task.id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: assigneeIds[0] ?? null,
        updatedById: user.id,
        assignees: { create: assigneeIds.map((employeeId) => ({ employeeId })) },
      },
    })
  })

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${data.id}`)
}

export async function deleteTask(taskId: string) {
  const user = await requireAuth()

  const task = await db.task.findFirst({
    where: { id: taskId, isDeleted: false },
    select: OWNERSHIP_SELECT,
  })

  if (!task) {
    throw new NotFoundError('Task')
  }

  const canDeleteAll = hasPermission(user, PERMISSIONS.TASKS_DELETE_ALL)
  const canDeleteOwn = isOwner(user, task) && hasPermission(user, PERMISSIONS.TASKS_DELETE_OWN)

  if (!canDeleteAll && !canDeleteOwn) {
    throw new ForbiddenError('You cannot delete this task.')
  }

  await db.task.update({
    where: { id: task.id },
    data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
  })

  revalidatePath('/tasks')
}

/** A user may view a task if they can read all tasks, own it, or belong to its project. */
async function assertCanView(user: SessionUser, task: OwnableTask) {
  if (hasPermission(user, PERMISSIONS.TASKS_READ_ALL)) return
  if (isOwner(user, task)) return

  if (task.projectId && user.employeeId) {
    const member = await db.projectMember.findUnique({
      where: { projectId_employeeId: { projectId: task.projectId, employeeId: user.employeeId } },
      select: { employeeId: true },
    })
    if (member) return
  }

  throw new ForbiddenError('You cannot view this task.')
}

export async function addTaskComment(taskId: string, content: string) {
  const user = await requireAuth()

  const task = await db.task.findFirst({
    where: { id: taskId, isDeleted: false },
    select: OWNERSHIP_SELECT,
  })

  if (!task) {
    throw new NotFoundError('Task')
  }

  await assertCanView(user, task)

  if (!content.trim()) {
    throw new BusinessRuleError('Comment cannot be empty.')
  }

  await db.taskComment.create({
    data: { taskId: task.id, authorId: user.id, content: content.trim() },
  })

  revalidatePath(`/tasks/${taskId}`)
}
