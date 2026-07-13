'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { EmployeeStatus } from '@prisma/client'
import { db } from '@/lib/db/prisma'
import { requirePermission } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'

interface CreateEmployeeInput {
  employeeCode: string
  name: string
  email: string
  password: string
  departmentId: string
  designationId: string
  joiningDate: string
}

export async function createEmployee(data: CreateEmployeeInput) {
  const actor = await requirePermission(PERMISSIONS.EMPLOYEES_CREATE_ALL)

  const existingUser = await db.user.findUnique({
    where: {
      email: data.email,
    },
  })

  if (existingUser) {
    throw new Error('Email already exists.')
  }

  const existingEmployee = await db.employee.findUnique({
    where: {
      employeeCode: data.employeeCode,
    },
  })

  if (existingEmployee) {
    throw new Error('Employee Code already exists.')
  }

  const passwordHash = await bcrypt.hash(data.password, 10)

  await db.$transaction(async (tx) => {
    const role = await tx.role.findFirst({
      where: {
        name: 'EMPLOYEE',
      },
    })

    if (!role) {
      throw new Error('Employee role not found.')
    }

    const user = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        domain: 'sdcindia01.com',
        roleId: role.id,
      },
    })

    await tx.employee.create({
      data: {
        employeeCode: data.employeeCode,
        userId: user.id,
        departmentId: data.departmentId,
        designationId: data.designationId,
        joiningDate: new Date(data.joiningDate),
        createdById: actor.id,
      },
    })
  })

  revalidatePath('/employees')

  redirect('/employees')
}

interface UpdateEmployeeInput {
  id: string
  name: string
  email: string
  password?: string
  departmentId: string
  designationId: string
  joiningDate: string
  status: EmployeeStatus
}

export async function updateEmployee(data: UpdateEmployeeInput) {
  const actor = await requirePermission(PERMISSIONS.EMPLOYEES_UPDATE_ALL)

  const employee = await db.employee.findUnique({
    where: { id: data.id },
    select: { id: true, userId: true, isDeleted: true },
  })

  if (!employee || employee.isDeleted) {
    throw new Error('Employee not found.')
  }

  // Ensure the email is not taken by a different user.
  const emailOwner = await db.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  })

  if (emailOwner && emailOwner.id !== employee.userId) {
    throw new Error('Email already exists.')
  }

  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: employee.userId },
      data: {
        name: data.name,
        email: data.email,
        ...(passwordHash ? { passwordHash } : {}),
      },
    })

    await tx.employee.update({
      where: { id: employee.id },
      data: {
        departmentId: data.departmentId,
        designationId: data.designationId,
        joiningDate: new Date(data.joiningDate),
        status: data.status,
        updatedById: actor.id,
      },
    })
  })

  revalidatePath('/employees')

  redirect('/employees')
}

export async function softDeleteEmployee(id: string) {
  const actor = await requirePermission(PERMISSIONS.EMPLOYEES_ARCHIVE_ALL)

  const employee = await db.employee.findUnique({
    where: { id },
    select: { id: true, userId: true, isDeleted: true },
  })

  if (!employee || employee.isDeleted) {
    throw new Error('Employee not found.')
  }

  await db.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: employee.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: actor.id,
        status: 'INACTIVE',
      },
    })

    // Deactivate the login so a removed employee can no longer sign in.
    await tx.user.update({
      where: { id: employee.userId },
      data: {
        isActive: false,
      },
    })
  })

  revalidatePath('/employees')
}
