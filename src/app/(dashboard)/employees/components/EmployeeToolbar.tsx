'use client'

import type { ReactNode } from 'react'
import { Search } from 'lucide-react'

import type { EmployeeStatus } from '@prisma/client'
import { EMPLOYEE_STATUSES, formatStatus } from './EmployeeColumns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EmployeeToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  status: EmployeeStatus | 'ALL'
  onStatusChange: (value: EmployeeStatus | 'ALL') => void
  /** Slot for the "Add Employee" action (dialog trigger). */
  action?: ReactNode
}

export function EmployeeToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  action,
}: EmployeeToolbarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-72">
          <Label htmlFor="employee-search">Search</Label>

          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

            <Input
              id="employee-search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Name, code or email"
              className="pl-9"
            />
          </div>
        </div>

        <div className="w-full sm:w-48">
          <Label htmlFor="employee-status">Status</Label>

          <select
            id="employee-status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as EmployeeStatus | 'ALL')}
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="ALL">All statuses</option>

            {EMPLOYEE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {formatStatus(value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  )
}
