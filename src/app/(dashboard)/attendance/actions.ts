'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { BusinessRuleError, ForbiddenError, NotFoundError } from '@/lib/errors/app.error'

/** Midnight of the current day — matches the `@db.Date` attendance key. */
function startOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

function hoursBetween(start: Date, end: Date): number {
  return Math.round(((end.getTime() - start.getTime()) / 3_600_000) * 100) / 100
}

async function currentEmployeeId(): Promise<string> {
  const user = await requireAuth()

  if (!user.employeeId) {
    throw new ForbiddenError('Your account is not linked to an employee record.')
  }

  return user.employeeId
}

export async function checkIn() {
  await requirePermission(PERMISSIONS.ATTENDANCE_CREATE_OWN)
  const employeeId = await currentEmployeeId()
  const date = startOfToday()

  const existing = await db.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date } },
    select: { id: true, clockInTime: true },
  })

  if (existing?.clockInTime) {
    throw new BusinessRuleError('You have already checked in today.')
  }

  const now = new Date()

  await db.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId, date } },
    update: { clockInTime: now, status: 'PRESENT', isAbsent: false },
    create: {
      employeeId,
      date,
      clockInTime: now,
      status: 'PRESENT',
    },
  })

  revalidatePath('/attendance')
}

export async function checkOut() {
  await requirePermission(PERMISSIONS.ATTENDANCE_CREATE_OWN)
  const employeeId = await currentEmployeeId()
  const date = startOfToday()

  const record = await db.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date } },
    select: { id: true, clockInTime: true, clockOutTime: true },
  })

  if (!record?.clockInTime) {
    throw new BusinessRuleError('You need to check in before checking out.')
  }

  if (record.clockOutTime) {
    throw new BusinessRuleError('You have already checked out today.')
  }

  const now = new Date()

  await db.attendanceRecord.update({
    where: { id: record.id },
    data: {
      clockOutTime: now,
      totalHours: hoursBetween(record.clockInTime, now),
    },
  })

  revalidatePath('/attendance')
}

interface RequestCorrectionInput {
  attendanceId: string
  requestedClockIn?: string
  requestedClockOut?: string
  reason: string
}

export async function requestCorrection(data: RequestCorrectionInput) {
  const user = await requirePermission(PERMISSIONS.ATTENDANCE_CORRECT_OWN)
  const employeeId = await currentEmployeeId()

  const record = await db.attendanceRecord.findUnique({
    where: { id: data.attendanceId },
    select: { id: true, employeeId: true },
  })

  if (!record || record.employeeId !== employeeId) {
    throw new NotFoundError('Attendance record')
  }

  if (!data.reason.trim()) {
    throw new BusinessRuleError('A reason is required for a correction request.')
  }

  await db.attendanceCorrection.create({
    data: {
      attendanceId: record.id,
      employeeId,
      requestedClockIn: data.requestedClockIn ? new Date(data.requestedClockIn) : null,
      requestedClockOut: data.requestedClockOut ? new Date(data.requestedClockOut) : null,
      reason: data.reason.trim(),
      createdById: user.id,
    },
  })

  revalidatePath('/attendance')
}

export async function reviewCorrection(
  correctionId: string,
  approve: boolean,
  rejectionReason?: string,
) {
  const approver = await requirePermission(PERMISSIONS.ATTENDANCE_CORRECT_ALL)

  const correction = await db.attendanceCorrection.findUnique({
    where: { id: correctionId },
    select: {
      id: true,
      status: true,
      attendanceId: true,
      requestedClockIn: true,
      requestedClockOut: true,
    },
  })

  if (!correction) {
    throw new NotFoundError('Correction request')
  }

  if (correction.status !== 'PENDING') {
    throw new BusinessRuleError('This correction has already been reviewed.')
  }

  await db.$transaction(async (tx) => {
    await tx.attendanceCorrection.update({
      where: { id: correction.id },
      data: {
        status: approve ? 'APPROVED' : 'REJECTED',
        approverId: approver.id,
        approvedAt: approve ? new Date() : null,
        rejectionReason: approve ? null : (rejectionReason?.trim() ?? null),
      },
    })

    if (approve) {
      const record = await tx.attendanceRecord.findUnique({
        where: { id: correction.attendanceId },
        select: { clockInTime: true, clockOutTime: true },
      })

      const clockInTime = correction.requestedClockIn ?? record?.clockInTime ?? null
      const clockOutTime = correction.requestedClockOut ?? record?.clockOutTime ?? null

      await tx.attendanceRecord.update({
        where: { id: correction.attendanceId },
        data: {
          clockInTime,
          clockOutTime,
          totalHours: clockInTime && clockOutTime ? hoursBetween(clockInTime, clockOutTime) : null,
          updatedById: approver.id,
        },
      })
    }
  })

  revalidatePath('/attendance')
}
