'use client'

import { useState, useTransition } from 'react'

import { setUserActive, updateUserRole } from '../actions'
import type { RoleName } from '@/lib/constants/roles.constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface UserAccessRow {
  id: string
  name: string
  email: string
  employeeCode: string | null
  roleName: string
  roleLabel: string
  isActive: boolean
  isSelf: boolean
}

interface RoleOption {
  name: string
  displayName: string
}

export function UserAccessTable({
  users,
  roles,
  canManageAccess,
}: {
  users: UserAccessRow[]
  roles: RoleOption[]
  canManageAccess: boolean
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left font-medium">Name</th>
            <th className="p-3 text-left font-medium">Employee Code</th>
            <th className="p-3 text-left font-medium">Role</th>
            <th className="p-3 text-left font-medium">Access</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <AccessRow key={user.id} user={user} roles={roles} canManageAccess={canManageAccess} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AccessRow({
  user,
  roles,
  canManageAccess,
}: {
  user: UserAccessRow
  roles: RoleOption[]
  canManageAccess: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function changeRole(roleName: string) {
    setError(null)
    startTransition(async () => {
      try {
        await updateUserRole(user.id, roleName as RoleName)
      } catch (roleError) {
        setError(roleError instanceof Error ? roleError.message : 'Failed to update role.')
      }
    })
  }

  function toggleActive() {
    setError(null)
    startTransition(async () => {
      try {
        await setUserActive(user.id, !user.isActive)
      } catch (activeError) {
        setError(activeError instanceof Error ? activeError.message : 'Failed to update access.')
      }
    })
  }

  const canEditThisUser = canManageAccess && !user.isSelf

  return (
    <tr className="hover:bg-muted/40 border-b">
      <td className="p-3">
        <div className="font-medium">{user.name}</div>
        <div className="text-muted-foreground text-xs">{user.email}</div>
      </td>
      <td className="text-muted-foreground p-3">{user.employeeCode ?? '—'}</td>
      <td className="p-3">
        {canEditThisUser ? (
          <select
            value={user.roleName}
            disabled={pending}
            onChange={(event) => changeRole(event.target.value)}
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          >
            {roles.map((role) => (
              <option key={role.name} value={role.name}>
                {role.displayName}
              </option>
            ))}
          </select>
        ) : (
          <Badge variant="outline">{user.roleLabel}</Badge>
        )}
        {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              user.isActive
                ? 'border-green-200 bg-green-100 text-green-700'
                : 'border-gray-200 bg-gray-100 text-gray-600'
            }
          >
            {user.isActive ? 'Active' : 'Disabled'}
          </Badge>

          {canEditThisUser ? (
            <Button variant="outline" size="sm" disabled={pending} onClick={toggleActive}>
              {user.isActive ? 'Disable' : 'Enable'}
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  )
}
