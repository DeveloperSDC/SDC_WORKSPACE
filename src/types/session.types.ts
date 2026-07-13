import type { DefaultSession } from 'next-auth'
import type { RoleName } from '@lib/constants/roles.constants'
import type { PermissionKey } from '@lib/constants/permissions.constants'

export type UserRole = RoleName

/**
 * Extends the default NextAuth session type with our custom fields.
 * This module augmentation ensures full TypeScript support everywhere.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      role: UserRole
      permissions: PermissionKey[]
      isActive: boolean
      employeeId: string | null
      employeeCode: string | null
      departmentId: string | null
      managerId: string | null
    } & DefaultSession['user']
  }

  interface User {
    role?: UserRole
  }
}

export type { PermissionKey }
