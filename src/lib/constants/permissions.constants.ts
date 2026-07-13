/**
 * Permission key constants.
 * Format: "{module}:{action}:{condition}"
 *
 * Conditions:
 *  own  — only own resources
 *  team — own + direct reports' resources
 *  all  — all resources in the org
 */
export const PERMISSIONS = {
  // Users
  USERS_READ_ALL: 'users:read:all',
  USERS_UPDATE_ALL: 'users:update:all',

  // Employees
  EMPLOYEES_READ_OWN: 'employees:read:own',
  EMPLOYEES_READ_TEAM: 'employees:read:team',
  EMPLOYEES_READ_ALL: 'employees:read:all',
  EMPLOYEES_CREATE_ALL: 'employees:create:all',
  EMPLOYEES_UPDATE_OWN: 'employees:update:own',
  EMPLOYEES_UPDATE_ALL: 'employees:update:all',
  EMPLOYEES_ARCHIVE_ALL: 'employees:archive:all',
  EMPLOYEES_TRANSFER_ALL: 'employees:transfer:all',
  EMPLOYEES_PROMOTE_ALL: 'employees:promote:all',

  // Attendance
  ATTENDANCE_READ_OWN: 'attendance:read:own',
  ATTENDANCE_READ_TEAM: 'attendance:read:team',
  ATTENDANCE_READ_ALL: 'attendance:read:all',
  ATTENDANCE_CREATE_OWN: 'attendance:create:own',
  ATTENDANCE_CORRECT_OWN: 'attendance:correct:own',
  ATTENDANCE_CORRECT_ALL: 'attendance:correct:all',

  // Leave
  LEAVE_READ_OWN: 'leave:read:own',
  LEAVE_READ_TEAM: 'leave:read:team',
  LEAVE_READ_ALL: 'leave:read:all',
  LEAVE_CREATE_OWN: 'leave:create:own',
  LEAVE_APPROVE_TEAM: 'leave:approve:team',
  LEAVE_APPROVE_ALL: 'leave:approve:all',

  // Tasks
  TASKS_READ_OWN: 'tasks:read:own',
  TASKS_READ_TEAM: 'tasks:read:team',
  TASKS_READ_ALL: 'tasks:read:all',
  TASKS_CREATE_OWN: 'tasks:create:own',
  TASKS_UPDATE_OWN: 'tasks:update:own',
  TASKS_UPDATE_ALL: 'tasks:update:all',
  TASKS_DELETE_OWN: 'tasks:delete:own',
  TASKS_DELETE_ALL: 'tasks:delete:all',

  // Projects
  PROJECTS_READ_OWN: 'projects:read:own',
  PROJECTS_READ_ALL: 'projects:read:all',
  PROJECTS_CREATE_ALL: 'projects:create:all',
  PROJECTS_UPDATE_ALL: 'projects:update:all',
  PROJECTS_DELETE_ALL: 'projects:delete:all',

  // Meetings
  MEETINGS_READ_OWN: 'meetings:read:own',
  MEETINGS_READ_ALL: 'meetings:read:all',
  MEETINGS_CREATE_OWN: 'meetings:create:own',
  MEETINGS_UPDATE_OWN: 'meetings:update:own',
  MEETINGS_UPDATE_ALL: 'meetings:update:all',
  MEETINGS_DELETE_OWN: 'meetings:delete:own',

  // CRM
  CRM_READ_OWN: 'crm:read:own',
  CRM_READ_ALL: 'crm:read:all',
  CRM_CREATE_OWN: 'crm:create:own',
  CRM_UPDATE_OWN: 'crm:update:own',
  CRM_UPDATE_ALL: 'crm:update:all',
  CRM_DELETE_ALL: 'crm:delete:all',

  // Documents
  DOCUMENTS_READ_OWN: 'documents:read:own',
  DOCUMENTS_READ_ALL: 'documents:read:all',
  DOCUMENTS_CREATE_OWN: 'documents:create:own',
  DOCUMENTS_DELETE_ALL: 'documents:delete:all',

  // Reports
  REPORTS_READ_OWN: 'reports:read:own',
  REPORTS_READ_ALL: 'reports:read:all',
  REPORTS_EXPORT_ALL: 'reports:export:all',

  // Admin
  ADMIN_READ_ALL: 'admin:read:all',
  ADMIN_SYNC_ALL: 'admin:sync:all',
  ADMIN_AUDIT_ALL: 'admin:audit:all',

  // Settings
  SETTINGS_READ_ALL: 'settings:read:all',
  SETTINGS_UPDATE_ALL: 'settings:update:all',
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
