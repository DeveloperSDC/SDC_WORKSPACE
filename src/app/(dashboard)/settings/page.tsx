import type { Metadata } from 'next'

import { db } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/guards'
import { PageHeader } from '@/components/layout/page-header'
import { ProfileForm } from './components/ProfileForm'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
  const session = await requireAuth()

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      name: true,
      email: true,
      employee: { select: { employeeCode: true } },
    },
  })

  return (
    <div className="flex max-w-3xl flex-col gap-6 p-6">
      <PageHeader title="Settings" description="Update your profile details and password." />

      <ProfileForm
        employeeCode={user?.employee?.employeeCode ?? null}
        name={user?.name ?? ''}
        email={user?.email ?? ''}
      />
    </div>
  )
}
