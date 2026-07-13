import type { Metadata } from 'next'
import { auth } from '@lib/auth/auth'
import { PageHeader } from '@components/layout/page-header'
import { DashboardWidgets } from '@components/dashboard/dashboard-widgets'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Good ${getTimeOfDay()}, ${session?.user?.name?.split(' ')[0] ?? 'there'}`}
        description="Here's what's happening today."
      />
      <DashboardWidgets session={session} />
    </div>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
