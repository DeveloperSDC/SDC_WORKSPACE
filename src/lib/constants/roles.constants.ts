/**
 * System role name constants.
 * These match the Role.name values seeded into the database.
 * NEVER use raw strings for role checks — always use these constants.
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  HR: 'HR',
  FINANCE: 'FINANCE',
  SALES: 'SALES',
  TEAM_LEAD: 'TEAM_LEAD',
  EMPLOYEE: 'EMPLOYEE',
  AUDITOR: 'AUDITOR',
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]
