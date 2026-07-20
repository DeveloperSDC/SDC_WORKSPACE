'use client'

import { useState } from 'react'

import { updateOwnProfile } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  employeeCode: string | null
  name: string
  email: string
}

export function ProfileForm({ employeeCode, name, email }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await updateOwnProfile({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        currentPassword: (formData.get('currentPassword') as string) || undefined,
        newPassword: (formData.get('newPassword') as string) || undefined,
      })
      setSuccess(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      {/* Profile details */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Profile details</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="employeeCode">Employee ID</Label>
            <Input id="employeeCode" value={employeeCode ?? '—'} readOnly disabled />
            <p className="text-muted-foreground mt-1 text-xs">Employee ID cannot be changed.</p>
          </div>

          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" defaultValue={name} required />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={email} required />
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="mb-1 text-lg font-semibold">Change password</h2>
        <p className="text-muted-foreground mb-4 text-xs">
          Leave blank to keep your current password.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">Profile updated successfully.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
