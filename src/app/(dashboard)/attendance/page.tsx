import type { Metadata } from 'next'

import { db } from '@/lib/db/prisma'
import { requireAuth, hasPermission } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { PageHeader } from '@/components/layout/page-header'
import { AttendanceClock } from './components/AttendanceClock'
import { CorrectionsQueue } from './components/CorrectionsQueue'
import { AttendanceStatusBadge } from './components/AttendanceStatusBadge'
import { LocalTime } from '@/components/ui/local-time'

export const metadata: Metadata = {
  title: 'Attendance',
}

function startOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

export default async function AttendancePage() {
  const user = await requireAuth()
  const canReviewAll = hasPermission(user, PERMISSIONS.ATTENDANCE_CORRECT_ALL)

  if (!user.employeeId) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Attendance" description="Track your working hours." />
        <p className="text-muted-foreground text-sm">
          Your account is not linked to an employee record, so attendance is unavailable.
        </p>
      </div>
    )
  }

  const employeeId = user.employeeId
  const today = startOfToday()

  const [todayRecord, history, pendingCorrections] = await Promise.all([
    db.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    }),

    db.attendanceRecord.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
      take: 14,
    }),

    canReviewAll
      ? db.attendanceCorrection.findMany({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'asc' },
          include: {
            employee: { include: { user: { select: { name: true } } } },
            attendance: { select: { date: true } },
          },
        })
      : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Attendance" description="Track your working hours." />

      {/* Today */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Today</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-2xl font-semibold">
                <LocalTime iso={iso(todayRecord?.clockInTime ?? null)} mode="time" />
                {' – '}
                <LocalTime iso={iso(todayRecord?.clockOutTime ?? null)} mode="time" />
              </span>
              {todayRecord ? <AttendanceStatusBadge status={todayRecord.status} /> : null}
            </div>
            {todayRecord?.totalHours != null ? (
              <p className="text-muted-foreground mt-1 text-sm">
                {todayRecord.totalHours} hours logged
              </p>
            ) : null}
          </div>

          <AttendanceClock
            hasCheckedIn={Boolean(todayRecord?.clockInTime)}
            hasCheckedOut={Boolean(todayRecord?.clockOutTime)}
          />
        </div>
      </div>

      {/* Pending corrections (approvers only) */}
      {canReviewAll ? (
        <CorrectionsQueue
          corrections={pendingCorrections.map((correction) => ({
            id: correction.id,
            employeeName: correction.employee.user.name,
            date: correction.attendance.date.toISOString(),
            requestedClockIn: iso(correction.requestedClockIn),
            requestedClockOut: iso(correction.requestedClockOut),
            reason: correction.reason,
          }))}
        />
      ) : null}

      {/* History */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent history</h2>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Clock in</th>
                <th className="p-3 text-left font-medium">Clock out</th>
                <th className="p-3 text-left font-medium">Hours</th>
                <th className="p-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground py-10 text-center">
                    No attendance records yet.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/40 border-b">
                    <td className="p-3">
                      <LocalTime iso={record.date.toISOString()} mode="date" />
                    </td>
                    <td className="p-3">
                      <LocalTime iso={iso(record.clockInTime)} mode="time" />
                    </td>
                    <td className="p-3">
                      <LocalTime iso={iso(record.clockOutTime)} mode="time" />
                    </td>
                    <td className="p-3">{record.totalHours ?? '—'}</td>
                    <td className="p-3">
                      <AttendanceStatusBadge status={record.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
