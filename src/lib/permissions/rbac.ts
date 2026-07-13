import type { RoleName } from '@lib/constants/roles.constants'
import type { PermissionKey } from '@lib/constants/permissions.constants'
import { ROLE_PERMISSIONS } from './permissions.map'

/**
 * RBAC engine.
 *
 * Usage:
 *   const allowed = can('TEAM_LEAD', 'leave:approve:team')
 *   if (!allowed) throw new ForbiddenError()
 */
export function can(role: RoleName, permission: PermissionKey): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  return permissions.includes(permission)
}

/**
 * Returns all permissions for a given role.
 */
export function getPermissionsForRole(role: RoleName): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? []
}

/**
 * Checks if a role has at least one of the given permissions.
 */
export function canAny(role: RoleName, permissions: PermissionKey[]): boolean {
  return permissions.some((p) => can(role, p))
}

/**
 * Checks if a role has all of the given permissions.
 */
export function canAll(role: RoleName, permissions: PermissionKey[]): boolean {
  return permissions.every((p) => can(role, p))
}
