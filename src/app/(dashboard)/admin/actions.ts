'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db/prisma'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { BusinessRuleError, NotFoundError } from '@/lib/errors/app.error'
import { ROLES, type RoleName } from '@/lib/constants/roles.constants'

const VALID_ROLES = new Set<string>(Object.values(ROLES))

/**
 * Change a user's role. Access management is reserved for the Super Admin,
 * per the SDC role hierarchy — Admins cannot modify anyone's access.
 */
export async function updateUserRole(userId: string, roleName: RoleName) {
  const actor = await requireSuperAdmin()

  if (userId === actor.id) {
    throw new BusinessRuleError('You cannot change your own role.')
  }

  if (!VALID_ROLES.has(roleName)) {
    throw new BusinessRuleError('Unknown role.')
  }

  const role = await db.role.findUnique({
    where: { name: roleName },
    select: { id: true },
  })

  if (!role) {
    throw new NotFoundError('Role', roleName)
  }

  await db.user.update({
    where: { id: userId },
    data: { roleId: role.id },
  })

  revalidatePath('/admin')
}

/**
 * Enable or disable a user's login. Super Admin only.
 */
export async function setUserActive(userId: string, isActive: boolean) {
  const actor = await requireSuperAdmin()

  if (userId === actor.id) {
    throw new BusinessRuleError('You cannot deactivate your own account.')
  }

  await db.user.update({
    where: { id: userId },
    data: { isActive },
  })

  revalidatePath('/admin')
}
