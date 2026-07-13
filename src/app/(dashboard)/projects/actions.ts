'use server'

import { revalidatePath } from 'next/cache'

import type {
  MilestoneStatus,
  ProjectMemberRole,
  ProjectStatus,
  TaskPriority,
} from '@prisma/client'
import { db } from '@/lib/db/prisma'
import { requirePermission } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { BusinessRuleError, NotFoundError } from '@/lib/errors/app.error'

interface CreateProjectInput {
  name: string
  description?: string
  priority: TaskPriority
  managerId: string
  startDate?: string
  endDate?: string
}

export async function createProject(data: CreateProjectInput) {
  const user = await requirePermission(PERMISSIONS.PROJECTS_CREATE_ALL)

  if (!data.name.trim()) {
    throw new BusinessRuleError('A project name is required.')
  }

  if (!data.managerId) {
    throw new BusinessRuleError('A project manager is required.')
  }

  const project = await db.project.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      priority: data.priority,
      managerId: data.managerId,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdById: user.id,
      members: {
        create: { employeeId: data.managerId, role: 'MANAGER' },
      },
    },
  })

  revalidatePath('/projects')

  return project.id
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const user = await requirePermission(PERMISSIONS.PROJECTS_UPDATE_ALL)

  const project = await db.project.findFirst({
    where: { id: projectId, isDeleted: false },
    select: { id: true },
  })

  if (!project) {
    throw new NotFoundError('Project')
  }

  await db.project.update({
    where: { id: project.id },
    data: { status, updatedById: user.id },
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
}

export async function softDeleteProject(projectId: string) {
  const user = await requirePermission(PERMISSIONS.PROJECTS_DELETE_ALL)

  const project = await db.project.findFirst({
    where: { id: projectId, isDeleted: false },
    select: { id: true },
  })

  if (!project) {
    throw new NotFoundError('Project')
  }

  await db.project.update({
    where: { id: project.id },
    data: { isDeleted: true, deletedAt: new Date(), deletedById: user.id },
  })

  revalidatePath('/projects')
}

export async function addProjectMember(
  projectId: string,
  employeeId: string,
  role: ProjectMemberRole,
) {
  await requirePermission(PERMISSIONS.PROJECTS_UPDATE_ALL)

  if (!employeeId) {
    throw new BusinessRuleError('Select an employee to add.')
  }

  await db.projectMember.upsert({
    where: { projectId_employeeId: { projectId, employeeId } },
    update: { role },
    create: { projectId, employeeId, role },
  })

  revalidatePath(`/projects/${projectId}`)
}

export async function removeProjectMember(projectId: string, employeeId: string) {
  await requirePermission(PERMISSIONS.PROJECTS_UPDATE_ALL)

  await db.projectMember.deleteMany({
    where: { projectId, employeeId, role: { not: 'MANAGER' } },
  })

  revalidatePath(`/projects/${projectId}`)
}

interface CreateMilestoneInput {
  projectId: string
  title: string
  dueDate: string
  description?: string
}

export async function createMilestone(data: CreateMilestoneInput) {
  const user = await requirePermission(PERMISSIONS.PROJECTS_UPDATE_ALL)

  if (!data.title.trim()) {
    throw new BusinessRuleError('A milestone title is required.')
  }

  if (!data.dueDate) {
    throw new BusinessRuleError('A milestone due date is required.')
  }

  await db.milestone.create({
    data: {
      projectId: data.projectId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      dueDate: new Date(data.dueDate),
      createdById: user.id,
    },
  })

  revalidatePath(`/projects/${data.projectId}`)
}

export async function updateMilestoneStatus(milestoneId: string, status: MilestoneStatus) {
  await requirePermission(PERMISSIONS.PROJECTS_UPDATE_ALL)

  const milestone = await db.milestone.findUnique({
    where: { id: milestoneId },
    select: { id: true, projectId: true },
  })

  if (!milestone) {
    throw new NotFoundError('Milestone')
  }

  await db.milestone.update({
    where: { id: milestone.id },
    data: {
      status,
      completedAt: status === 'COMPLETED' ? new Date() : null,
    },
  })

  revalidatePath(`/projects/${milestone.projectId}`)
}
