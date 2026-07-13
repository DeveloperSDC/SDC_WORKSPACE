'use client'

import { useState, useTransition } from 'react'
import { UserPlus, X } from 'lucide-react'

import type { ProjectMemberRole } from '@prisma/client'
import { addProjectMember, removeProjectMember } from '../../actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Member {
  employeeId: string
  name: string
  role: ProjectMemberRole
}

const ROLES: ProjectMemberRole[] = ['LEAD', 'MEMBER', 'VIEWER']

const selectClass = 'border-input bg-background h-10 rounded-md border px-3 text-sm'

export function MembersManager({
  projectId,
  canManage,
  members,
  assignableEmployees,
}: {
  projectId: string
  canManage: boolean
  members: Member[]
  assignableEmployees: { id: string; name: string }[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function add(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await addProjectMember(
          projectId,
          formData.get('employeeId') as string,
          formData.get('role') as ProjectMemberRole,
        )
      } catch (addError) {
        setError(addError instanceof Error ? addError.message : 'Failed to add member.')
      }
    })
  }

  function remove(employeeId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await removeProjectMember(projectId, employeeId)
      } catch (removeError) {
        setError(removeError instanceof Error ? removeError.message : 'Failed to remove member.')
      }
    })
  }

  return (
    <div className="bg-card rounded-xl border p-6">
      <h2 className="mb-4 text-lg font-semibold">Team ({members.length})</h2>

      <ul className="divide-y">
        {members.map((member) => (
          <li key={member.employeeId} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{member.name}</span>
              <Badge variant="outline">
                {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
              </Badge>
            </div>

            {canManage && member.role !== 'MANAGER' ? (
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                onClick={() => remove(member.employeeId)}
                aria-label={`Remove ${member.name}`}
                className="text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      {canManage && assignableEmployees.length > 0 ? (
        <form action={add} className="mt-4 flex flex-wrap items-center gap-2">
          <select name="employeeId" required defaultValue="" className={`${selectClass} flex-1`}>
            <option value="">Add member…</option>
            {assignableEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>

          <select name="role" defaultValue="MEMBER" className={selectClass}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          <Button type="submit" disabled={pending} size="sm" className="gap-1">
            <UserPlus className="h-4 w-4" />
            Add
          </Button>
        </form>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
