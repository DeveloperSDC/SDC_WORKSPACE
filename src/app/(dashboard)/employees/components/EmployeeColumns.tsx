import type { Employee, EmployeeStatus, User, Department, Designation } from '@prisma/client'

import { Badge } from '@/components/ui/badge'

/**
 * Shape of an employee row as loaded by the Employees page.
 * Keeps the table and toolbar strongly typed instead of `any`.
 */
export type EmployeeRow = Employee & {
  user: Pick<User, 'id' | 'name' | 'email' | 'isActive'>
  department: Pick<Department, 'id' | 'name'>
  designation: Pick<Designation, 'id' | 'name'>
}

/**
 * Columns rendered by the employee table, in order.
 * Centralized here so headers and cells stay in sync.
 */
export const EMPLOYEE_COLUMNS = [
  { key: 'employeeCode', header: 'Employee Code' },
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'department', header: 'Department' },
  { key: 'designation', header: 'Designation' },
  { key: 'status', header: 'Status' },
  { key: 'actions', header: '' },
] as const

/**
 * All selectable employee statuses (mirrors the Prisma enum).
 */
export const EMPLOYEE_STATUSES: EmployeeStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'ON_LEAVE',
  'PROBATION',
  'RESIGNED',
  'TERMINATED',
]

const STATUS_STYLES: Record<EmployeeStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-700 border-gray-200',
  ON_LEAVE: 'bg-amber-100 text-amber-700 border-amber-200',
  PROBATION: 'bg-blue-100 text-blue-700 border-blue-200',
  RESIGNED: 'bg-orange-100 text-orange-700 border-orange-200',
  TERMINATED: 'bg-red-100 text-red-700 border-red-200',
}

export function formatStatus(status: EmployeeStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {formatStatus(status)}
    </Badge>
  )
}
