import type { Metadata } from 'next'

import { db } from '@/lib/db/prisma'
import { requirePermission } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { ROLES } from '@/lib/constants/roles.constants'
import { PageHeader } from '@/components/layout/page-header'
import { UserAccessTable, type UserAccessRow } from './components/UserAccessTable'

export const metadata: Metadata = {
  title: 'Access Management',
}

export default async function AdminPage() {
  const user = await requirePermission(PERMISSIONS.ADMIN_READ_ALL)
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN

  const [users, roles] = await Promise.all([
    db.user.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: { select: { name: true, displayName: true } },
        employee: { select: { employeeCode: true } },
      },
    }),

    db.role.findMany({
      orderBy: { displayName: 'asc' },
      select: { name: true, displayName: true },
    }),
  ])

  const rows: UserAccessRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    employeeCode: u.employee?.employeeCode ?? null,
    roleName: u.role.name,
    roleLabel: u.role.displayName,
    isActive: u.isActive,
    isSelf: u.id === user.id,
  }))

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Access Management"
        description={
          isSuperAdmin
            ? 'Assign roles and control who can sign in.'
            : 'View team access. Only a Super Admin can modify roles.'
        }
      />

      <div className="bg-card rounded-xl border p-6">
        <UserAccessTable users={rows} roles={roles} canManageAccess={isSuperAdmin} />
      </div>
    </div>
  )
}
