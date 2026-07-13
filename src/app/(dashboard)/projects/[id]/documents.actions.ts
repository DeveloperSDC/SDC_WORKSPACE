'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db/prisma'
import { requireAuth, hasPermission, type SessionUser } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { BusinessRuleError, ForbiddenError, NotFoundError } from '@/lib/errors/app.error'

/**
 * Managing project documents (add / toggle visibility / delete) is allowed for
 * admins (PROJECTS_UPDATE_ALL) and the project's own manager.
 */
async function requireDocManager(projectId: string): Promise<SessionUser> {
  const user = await requireAuth()

  if (hasPermission(user, PERMISSIONS.PROJECTS_UPDATE_ALL)) {
    return user
  }

  const project = await db.project.findFirst({
    where: { id: projectId, isDeleted: false },
    select: { managerId: true },
  })

  if (!project) {
    throw new NotFoundError('Project')
  }

  if (project.managerId !== user.employeeId) {
    throw new ForbiddenError('Only the project manager or an admin can manage documents.')
  }

  return user
}

interface AddDocumentInput {
  projectId: string
  title: string
  url: string
  description?: string
  isVisibleToTeam: boolean
}

export async function addProjectDocument(data: AddDocumentInput) {
  const user = await requireDocManager(data.projectId)

  if (!data.title.trim()) {
    throw new BusinessRuleError('A document title is required.')
  }

  let url: URL
  try {
    url = new URL(data.url.trim())
  } catch {
    throw new BusinessRuleError('Enter a valid document link (https://…).')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BusinessRuleError('Document links must start with http:// or https://')
  }

  await db.projectDocument.create({
    data: {
      projectId: data.projectId,
      title: data.title.trim(),
      url: url.toString(),
      description: data.description?.trim() || null,
      isVisibleToTeam: data.isVisibleToTeam,
      uploadedById: user.id,
    },
  })

  revalidatePath(`/projects/${data.projectId}`)
}

export async function setDocumentVisibility(documentId: string, isVisibleToTeam: boolean) {
  const document = await db.projectDocument.findUnique({
    where: { id: documentId },
    select: { id: true, projectId: true },
  })

  if (!document) {
    throw new NotFoundError('Document')
  }

  await requireDocManager(document.projectId)

  await db.projectDocument.update({
    where: { id: document.id },
    data: { isVisibleToTeam },
  })

  revalidatePath(`/projects/${document.projectId}`)
}

export async function deleteProjectDocument(documentId: string) {
  const document = await db.projectDocument.findUnique({
    where: { id: documentId },
    select: { id: true, projectId: true },
  })

  if (!document) {
    throw new NotFoundError('Document')
  }

  await requireDocManager(document.projectId)

  await db.projectDocument.delete({ where: { id: document.id } })

  revalidatePath(`/projects/${document.projectId}`)
}
