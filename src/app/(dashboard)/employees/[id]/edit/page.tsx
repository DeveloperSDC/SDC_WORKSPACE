import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { db } from '@/lib/db/prisma'
import { EmployeeForm } from '../../components/EmployeeForm'
import { Button } from '@/components/ui/button'

interface EditEmployeePageProps {
  params: Promise<{ id: string }>
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const { id } = await params

  const [employee, departments, designations] = await Promise.all([
    db.employee.findFirst({
      where: { id, isDeleted: false },
      include: { user: true },
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

  if (!employee) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to employees"
          nativeButton={false}
          render={<Link href="/employees" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-3xl font-bold">Edit Employee</h1>

          <p className="text-muted-foreground">Update {employee.user.name}&apos;s details.</p>
        </div>
      </div>

      <EmployeeForm
        departments={departments}
        designations={designations}
        employee={{
          id: employee.id,
          employeeCode: employee.employeeCode,
          name: employee.user.name ?? '',
          email: employee.user.email,
          departmentId: employee.departmentId,
          designationId: employee.designationId,
          joiningDate: employee.joiningDate.toISOString().slice(0, 10),
          status: employee.status,
        }}
      />
    </div>
  )
}
