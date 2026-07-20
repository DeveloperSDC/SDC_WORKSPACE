import { Users } from 'lucide-react'

import { db } from '@/lib/db/prisma'
import { requireAuth, hasPermission } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { EmployeeTable } from './components/EmployeeTable'

export default async function EmployeesPage() {
  const user = await requireAuth()
  // Only Admin / Super Admin (or HR) can add, edit, or remove employees.
  const canManage = hasPermission(user, PERMISSIONS.EMPLOYEES_CREATE_ALL)

  const [employees, departments, designations] = await Promise.all([
    db.employee.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        user: true,
        department: true,
        designation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),

    db.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),

    db.designation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  const totalEmployees = employees.length
  const activeEmployees = employees.filter((employee) => employee.status === 'ACTIVE').length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>

        <p className="text-muted-foreground mt-1">Manage employees across your organization.</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Employees</p>

              <h2 className="mt-2 text-3xl font-bold">{totalEmployees}</h2>
            </div>

            <Users className="text-primary h-10 w-10" />
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Active Employees</p>

              <h2 className="mt-2 text-3xl font-bold">{activeEmployees}</h2>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-card rounded-xl border p-6">
        <EmployeeTable
          employees={employees}
          departments={departments}
          designations={designations}
          canManage={canManage}
        />
      </div>
    </div>
  )
}
