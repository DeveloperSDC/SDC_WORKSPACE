import type { Metadata } from 'next'
import Link from 'next/link'

import { db } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/guards'
import { PageHeader } from '@/components/layout/page-header'
import { DashboardWidgets, type DashboardStats } from '@/components/dashboard/dashboard-widgets'
import { LocalTime } from '@/components/ui/local-time'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const OPEN_TASK_STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED'] as const

function startOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const employeeId = user.employeeId

  const [todayAttendance, pendingTasks, teamMembers, myProjects] = await Promise.all([
    employeeId
      ? db.attendanceRecord.findUnique({
          where: { employeeId_date: { employeeId, date: startOfToday() } },
          select: { clockInTime: true, clockOutTime: true, status: true },
        })
      : Promise.resolve(null),

    employeeId
      ? db.task.findMany({
          where: {
            assigneeId: employeeId,
            isDeleted: false,
            status: { in: [...OPEN_TASK_STATUSES] },
          },
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            project: { select: { name: true } },
          },
        })
      : Promise.resolve([]),

    user.departmentId
      ? db.employee.count({
          where: { departmentId: user.departmentId, isDeleted: false },
        })
      : Promise.resolve(0),

    employeeId
      ? db.project.count({
          where: {
            isDeleted: false,
            OR: [{ managerId: employeeId }, { members: { some: { employeeId } } }],
          },
        })
      : Promise.resolve(0),
  ])

  const attendanceLabel = todayAttendance?.clockInTime
    ? todayAttendance.clockOutTime
      ? 'Checked out'
      : 'Present'
    : 'Not in'

  const stats: DashboardStats = {
    attendance: attendanceLabel,
    pendingTasks: pendingTasks.length,
    myProjects,
    teamMembers,
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={`Good ${getTimeOfDay()}, ${user.name?.split(' ')[0] ?? 'there'}`}
        description="Here's what's happening today."
      />

      <DashboardWidgets stats={stats} />

      {/* My pending tasks */}
      <div className="bg-card rounded-xl border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My pending tasks</h2>
          <Link href="/tasks" className="text-muted-foreground text-sm hover:underline">
            View all
          </Link>
        </div>

        {pendingTasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">🎉 No pending tasks assigned to you.</p>
        ) : (
          <ul className="divide-y">
            {pendingTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {task.title}
                  </Link>
                  <p className="text-muted-foreground text-xs capitalize">
                    {task.project?.name ? `${task.project.name} · ` : ''}
                    {task.status.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
                {task.dueDate ? (
                  <span className="text-muted-foreground shrink-0 text-xs">
                    Due <LocalTime iso={task.dueDate.toISOString()} mode="date" />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
