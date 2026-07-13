import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@lib/db/prisma'
import { authConfig } from './auth.config'
import type { UserRole } from '@/types/session.types'
import type { PermissionKey } from '@lib/constants/permissions.constants'

type AuthTokenClaims = {
  role?: UserRole
  permissions?: PermissionKey[]
  isActive?: boolean
  employeeId?: string | null
  employeeCode?: string | null
  departmentId?: string | null
  managerId?: string | null
}

const credentialsSchema = z.object({
  employeeId: z.string().trim().min(1),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: PrismaAdapter(db),

  providers: [
    CredentialsProvider({
      name: 'Employee ID and Password',
      credentials: {
        employeeId: { label: 'Employee ID', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials)

        if (!parsedCredentials.success) {
          return null
        }

        const employee = await db.employee.findUnique({
          where: { employeeCode: parsedCredentials.data.employeeId },
          select: {
            id: true,
            employeeCode: true,
            isDeleted: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                photoUrl: true,
                passwordHash: true,
                isActive: true,
                isDeleted: true,
              },
            },
          },
        })

        if (
          !employee ||
          employee.isDeleted ||
          employee.user.isDeleted ||
          !employee.user.isActive ||
          !employee.user.passwordHash
        ) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          parsedCredentials.data.password,
          employee.user.passwordHash,
        )

        if (!isPasswordValid) {
          return null
        }

        await db.user.update({
          where: { id: employee.user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: employee.user.id,
          email: employee.user.email,
          name: employee.user.name,
          image: employee.user.photoUrl ?? undefined,
        }
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    /**
     * Keeps the JWT aligned with the database-backed user and RBAC state.
     */
    async jwt({ token }) {
      if (!token.sub) {
        return token
      }

      const authToken = token as typeof token & AuthTokenClaims

      const dbUser = await db.user.findUnique({
        where: { id: token.sub },
        select: {
          email: true,
          name: true,
          photoUrl: true,
          isActive: true,
          role: {
            select: {
              name: true,
              permissions: {
                select: {
                  permission: {
                    select: { key: true },
                  },
                },
              },
            },
          },
          employee: {
            select: { id: true, employeeCode: true, departmentId: true, managerId: true },
          },
        },
      })

      if (!dbUser || !dbUser.isActive) {
        authToken.isActive = false
        return token
      }

      const permissions = dbUser.role.permissions.map((rp) => rp.permission.key) as PermissionKey[]

      authToken.email = dbUser.email
      authToken.name = dbUser.name
      authToken.picture = dbUser.photoUrl ?? undefined
      authToken.role = dbUser.role.name as UserRole
      authToken.permissions = permissions
      authToken.isActive = dbUser.isActive
      authToken.employeeId = dbUser.employee?.id ?? null
      authToken.employeeCode = dbUser.employee?.employeeCode ?? null
      authToken.departmentId = dbUser.employee?.departmentId ?? null
      authToken.managerId = dbUser.employee?.managerId ?? null

      return token
    },
  },
})
