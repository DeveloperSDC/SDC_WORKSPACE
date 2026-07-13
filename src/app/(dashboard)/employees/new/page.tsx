import { db } from '@/lib/db/prisma'
import { EmployeeForm } from '../components/EmployeeForm'

export default async function NewEmployeePage() {
  const [departments, designations] = await Promise.all([
    db.department.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),

    db.designation.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Add Employee</h1>

        <p className="text-muted-foreground">Create a new employee account.</p>
      </div>

      <EmployeeForm departments={departments} designations={designations} />
    </div>
  )
}
