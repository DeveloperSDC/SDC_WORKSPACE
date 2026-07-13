import type { Session } from 'next-auth'

import { auth } from './auth'
import { ForbiddenError, UnauthorizedError } from '@/lib/errors/app.error'
import { ROLES } from '@/lib/constants/roles.constants'
import type { PermissionKey } from '@/lib/constants/permissions.constants'

export type SessionUser = Session['user']

/**
 * Server-side authorization guards for use in Server Actions and route handlers.
 *
 * Each `require*` helper returns the authenticated user or throws an AppError
 * (UnauthorizedError / ForbiddenError) that the caller surfaces to the client.
 */

export async function requireAuth(): Promise<SessionUser> {
  const session = await auth()

  if (!session?.user || !session.user.isActive) {
    throw new UnauthorizedError()
  }

  return session.user
}

export function hasPermission(user: SessionUser, permission: PermissionKey): boolean {
  return user.permissions.includes(permission)
}

export async function requirePermission(permission: PermissionKey): Promise<SessionUser> {
  const user = await requireAuth()

  if (!hasPermission(user, permission)) {
    throw new ForbiddenError()
  }

  return user
}

export async function requireAnyPermission(permissions: PermissionKey[]): Promise<SessionUser> {
  const user = await requireAuth()

  if (!permissions.some((permission) => hasPermission(user, permission))) {
    throw new ForbiddenError()
  }

  return user
}

/**
 * Access-control operations (granting/modifying roles & permissions) are
 * reserved for the Super Admin, per the role hierarchy.
 */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireAuth()

  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new ForbiddenError('Only a Super Admin can perform this action')
  }

  return user
}
