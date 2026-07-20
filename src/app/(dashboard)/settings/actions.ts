'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/guards'
import { BusinessRuleError, NotFoundError } from '@/lib/errors/app.error'

interface UpdateProfileInput {
  name: string
  email: string
  currentPassword?: string
  newPassword?: string
}

/**
 * Update the signed-in user's own profile: name, email, and password.
 * Employee ID (employeeCode) is intentionally NOT editable here.
 */
export async function updateOwnProfile(data: UpdateProfileInput) {
  const session = await requireAuth()

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, passwordHash: true },
  })

  if (!user) {
    throw new NotFoundError('User')
  }

  if (!data.name.trim()) {
    throw new BusinessRuleError('Name is required.')
  }

  const email = data.email.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    throw new BusinessRuleError('A valid email is required.')
  }

  // Email must not belong to a different user.
  const emailOwner = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (emailOwner && emailOwner.id !== user.id) {
    throw new BusinessRuleError('That email is already in use.')
  }

  let passwordHash: string | undefined
  if (data.newPassword) {
    if (data.newPassword.length < 8) {
      throw new BusinessRuleError('New password must be at least 8 characters.')
    }

    // Verify current password before allowing a change.
    if (user.passwordHash) {
      const ok = data.currentPassword
        ? await bcrypt.compare(data.currentPassword, user.passwordHash)
        : false
      if (!ok) {
        throw new BusinessRuleError('Your current password is incorrect.')
      }
    }

    passwordHash = await bcrypt.hash(data.newPassword, 12)
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name: data.name.trim(),
      email,
      ...(passwordHash ? { passwordHash } : {}),
    },
  })

  revalidatePath('/settings')
}
