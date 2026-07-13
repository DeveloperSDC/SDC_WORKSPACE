'use client'

import { useState } from 'react'

import type { EmployeeStatus } from '@prisma/client'
import { createEmployee, updateEmployee } from '../actions'
import { EMPLOYEE_STATUSES, formatStatus } from './EmployeeColumns'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EmployeeFormProps {
  departments: {
    id: string
    name: string
  }[]

  designations: {
    id: string
    name: string
  }[]

  /** When provided, the form edits this employee instead of creating one. */
  employee?: {
    id: string
    employeeCode: string
    name: string
    email: string
    departmentId: string
    designationId: string
    joiningDate: string
    status: EmployeeStatus
  }

  /** Called after a successful submit (e.g. to close a dialog). */
  onSuccess?: () => void
}

export function EmployeeForm({
  departments,
  designations,
  employee,
  onSuccess,
}: EmployeeFormProps) {
  const isEdit = Boolean(employee)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    try {
      if (isEdit && employee) {
        await updateEmployee({
          id: employee.id,
          name: formData.get('name') as string,
          email: formData.get('email') as string,
          password: (formData.get('password') as string) || undefined,
          departmentId: formData.get('departmentId') as string,
          designationId: formData.get('designationId') as string,
          joiningDate: formData.get('joiningDate') as string,
          status: formData.get('status') as EmployeeStatus,
        })
      } else {
        await createEmployee({
          employeeCode: formData.get('employeeCode') as string,
          name: formData.get('name') as string,
          email: formData.get('email') as string,
          password: formData.get('password') as string,
          departmentId: formData.get('departmentId') as string,
          designationId: formData.get('designationId') as string,
          joiningDate: formData.get('joiningDate') as string,
        })
      }

      onSuccess?.()
    } catch (submitError) {
      // Re-throw Next.js redirects so navigation still happens.
      if (submitError instanceof Error && submitError.message.includes('NEXT_REDIRECT')) {
        throw submitError
      }

      setError(
        submitError instanceof Error
          ? submitError.message
          : `Failed to ${isEdit ? 'update' : 'create'} employee.`,
      )
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="employeeCode">Employee Code</Label>
            <Input
              id="employeeCode"
              name="employeeCode"
              placeholder="SDC0002"
              defaultValue={employee?.employeeCode}
              readOnly={isEdit}
              required={!isEdit}
            />
          </div>

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="John Doe"
              defaultValue={employee?.name}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@sdcindia01.com"
              defaultValue={employee?.email}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">
              {isEdit ? 'Password (leave blank to keep)' : 'Password'}
            </Label>
            <Input id="password" name="password" type="password" required={!isEdit} />
          </div>

          <div>
            <Label htmlFor="departmentId">Department</Label>

            <select
              id="departmentId"
              name="departmentId"
              required
              defaultValue={employee?.departmentId ?? ''}
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select Department</option>

              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="designationId">Designation</Label>

            <select
              id="designationId"
              name="designationId"
              required
              defaultValue={employee?.designationId ?? ''}
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select Designation</option>

              {designations.map((designation) => (
                <option key={designation.id} value={designation.id}>
                  {designation.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="joiningDate">Joining Date</Label>
            <Input
              id="joiningDate"
              name="joiningDate"
              type="date"
              defaultValue={employee?.joiningDate}
              required
            />
          </div>

          {isEdit ? (
            <div>
              <Label htmlFor="status">Status</Label>

              <select
                id="status"
                name="status"
                required
                defaultValue={employee?.status}
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              >
                {EMPLOYEE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {formatStatus(value)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}

          <div className="flex items-end justify-end md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading
                ? isEdit
                  ? 'Saving...'
                  : 'Creating Employee...'
                : isEdit
                  ? 'Save Changes'
                  : 'Create Employee'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
