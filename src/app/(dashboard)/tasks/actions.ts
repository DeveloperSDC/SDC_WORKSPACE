'use server'

import { revalidatePath } from 'next/cache'

import type { TaskPriority, TaskStatus } from '@prisma/client'
import { db } from '@/lib/db/prisma'
import { requireAuth, requirePermission, hasPermission, type SessionUser } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { BusinessRuleError, ForbiddenError, NotFoundError } from '@/lib/errors/app.error'

async function currentEmployeeId(user: SessionUser): Promise<string> {
  if (!user.employeeId) {
    throw new ForbiddenError('Your account is not linked to an employee record.')
  }
  return user.employeeId
}

/** A user may manage a task if they can manage all tasks, or own it (reporter/assignee). */
function assertCanManage(
  user: SessionUser,
  task: { reporterId: string; assigneeId: string | null },
) {
  if (hasPermission(user, PERMISSIONS.TASKS_UPDATE_ALL)) return

  const owns = task.reporterId === user.employeeId || task.assigneeId === user.employeeId

  if (owns && hasPermission(user, PERMISSIONS.TASKS_UPDATE_OWN)) return

  throw new ForbiddenError('You cannot modify this task.')
}

interface CreateTaskInput {
  title: string
  description?: string
  priority: TaskPriority
  dueDate?: string
  assigneeId?: string
  projectId?: string
}

export async function createTask(data: CreateTaskInput) {
  const user = await requirePermission(PERMISSIONS.TASKS_CREATE_OWN)
  const reporterId = await currentEmployeeId(user)

  if (!data.title.trim()) {
    throw new BusinessRuleError('A task title is required.')
  }

  await db.task.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId || null,
      projectId: data.projectId || null,
      reporterId,
      createdById: user.id,
    },
  })

  revalidatePath('/tasks')
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const user = await requireAuth()

  const task = await db.task.findFirst({
    where: { id: taskId, isDeleted: false },
    select: { id: true, reporterId: true, assigneeId: true },
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
  assigneeId?: string
}

export async function updateTask(data: UpdateTaskInput) {
  const user = await requireAuth()

  const task = await db.task.findFirst({
    where: { id: data.id, isDeleted: false },
    select: { id: true, reporterId: true, assigneeId: true },
  })

  if (!task) {
    throw new NotFoundError('Task')
  }

  assertCanManage(user, task)

  if (!data.title.trim()) {
    throw new BusinessRuleError('A task title is required.')
  }

  await db.task.update({
    where: { id: task.id },
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId || null,
      updatedById: user.id,
    },
  })

  revalidatePath('/tasks')
}

export async function deleteTask(taskId: string) {
  const user = await requireAuth()

  const task = await db.task.findFirst({
    where: { id: taskId, isDeleted: false },
    select: { id: true, reporterId: true, assigneeId: true },
  })

  if (!task) {
    throw new NotFoundError('Task')
  }

  const canDeleteAll = hasPermission(user, PERMISSIONS.TASKS_DELETE_ALL)
  const owns = task.reporterId === user.employeeId || task.assigneeId === user.employeeId
  const canDeleteOwn = owns && hasPermission(user, PERMISSIONS.TASKS_DELETE_OWN)

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
async function assertCanView(
  user: SessionUser,
  task: { reporterId: string; assigneeId: string | null; projectId: string | null },
) {
  if (hasPermission(user, PERMISSIONS.TASKS_READ_ALL)) return

  const owns = task.reporterId === user.employeeId || task.assigneeId === user.employeeId
  if (owns) return

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
    select: { id: true, reporterId: true, assigneeId: true, projectId: true },
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
