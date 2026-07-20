'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Users } from 'lucide-react'

import type { EmployeeStatus } from '@prisma/client'
import { softDeleteEmployee } from '../actions'
import { EMPLOYEE_COLUMNS, StatusBadge, type EmployeeRow } from './EmployeeColumns'
import { EmployeeToolbar } from './EmployeeToolbar'
import { AddEmployeeDialog } from './AddEmployeeDialog'
import { Button } from '@/components/ui/button'

interface EmployeeTableProps {
  employees: EmployeeRow[]
  departments: { id: string; name: string }[]
  designations: { id: string; name: string }[]
  /** Admin / Super Admin only — controls whether add/edit/remove are shown. */
  canManage: boolean
}

export function EmployeeTable({
  employees,
  departments,
  designations,
  canManage,
}: EmployeeTableProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EmployeeStatus | 'ALL'>('ALL')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return employees.filter((employee) => {
      const matchesStatus = status === 'ALL' || employee.status === status

      const matchesQuery =
        query.length === 0 ||
        employee.employeeCode.toLowerCase().includes(query) ||
        employee.user.name.toLowerCase().includes(query) ||
        employee.user.email.toLowerCase().includes(query)

      return matchesStatus && matchesQuery
    })
  }, [employees, search, status])

  return (
    <div className="space-y-4">
      <EmployeeToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        action={
          canManage ? (
            <AddEmployeeDialog departments={departments} designations={designations} />
          ) : undefined
        }
      />

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {EMPLOYEE_COLUMNS.map((column) => (
                <th key={column.key} className="p-3 text-left font-medium">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={EMPLOYEE_COLUMNS.length}
                  className="text-muted-foreground py-12 text-center"
                >
                  <Users className="mx-auto mb-3 h-8 w-8 opacity-60" />
                  No employees match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((employee) => (
                <tr key={employee.id} className="hover:bg-muted/40 border-b">
                  <td className="p-3">{employee.employeeCode}</td>
                  <td className="p-3">{employee.user.name}</td>
                  <td className="text-muted-foreground p-3">{employee.user.email}</td>
                  <td className="p-3">{employee.department.name}</td>
                  <td className="p-3">{employee.designation.name}</td>
                  <td className="p-3">
                    <StatusBadge status={employee.status} />
                  </td>
                  <td className="p-3">
                    {canManage ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${employee.user.name}`}
                          nativeButton={false}
                          render={<Link href={`/employees/${employee.id}/edit`} />}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <DeleteEmployeeButton id={employee.id} name={employee.user.name} />
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground text-xs">
        Showing {filtered.length} of {employees.length} employees.
      </p>
    </div>
  )
}

function DeleteEmployeeButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    const confirmed = window.confirm(
      `Remove ${name}? Their login will be disabled. This can be reversed by an admin.`,
    )

    if (!confirmed) {
      return
    }

    startTransition(async () => {
      try {
        await softDeleteEmployee(id)
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to remove employee.')
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={handleDelete}
      aria-label={`Remove ${name}`}
      className="text-red-600 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
