import type { Session } from 'next-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, CheckSquare, Calendar } from 'lucide-react'

interface DashboardWidgetsProps {
  session: Session | null
}

/**
 * Dashboard widget grid.
 * Phase 1: Static placeholder widgets.
 * Phase 2+: Replace with real data fetched from services.
 */
export function DashboardWidgets({ session: _session }: DashboardWidgetsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="My Attendance"
        value="Present"
        description="Today"
        icon={Clock}
        iconClassName="text-green-500"
      />
      <StatCard
        title="Pending Tasks"
        value="—"
        description="Assigned to you"
        icon={CheckSquare}
        iconClassName="text-blue-500"
      />
      <StatCard
        title="Upcoming Meetings"
        value="—"
        description="Next 7 days"
        icon={Calendar}
        iconClassName="text-purple-500"
      />
      <StatCard
        title="Team Members"
        value="—"
        description="In your department"
        icon={Users}
        iconClassName="text-orange-500"
      />
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  iconClassName?: string
}

function StatCard({ title, value, description, icon: Icon, iconClassName }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconClassName ?? 'text-muted-foreground'}`} aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  )
}
