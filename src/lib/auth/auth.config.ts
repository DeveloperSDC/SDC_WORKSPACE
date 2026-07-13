import type { NextAuthConfig } from 'next-auth'
import type { RoleName } from '@lib/constants/roles.constants'
import type { PermissionKey } from '@lib/constants/permissions.constants'

type AuthTokenClaims = {
  role?: RoleName
  permissions?: PermissionKey[]
  isActive?: boolean
  employeeId?: string | null
  employeeCode?: string | null
  departmentId?: string | null
  managerId?: string | null
}

function getStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

/**
 * Auth.js v5 configuration.
 * Separated from auth.ts so it can be used in Edge middleware
 * without importing Node.js-specific modules (like Prisma).
 */
export const authConfig: NextAuthConfig = {
  providers: [],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        const authToken = token as typeof token & AuthTokenClaims

        session.user = {
          ...session.user,
          id: token.sub,
          email: token.email ?? '',
          name: token.name ?? '',
          image: token.picture ?? undefined,
          role: authToken.role as RoleName,
          permissions: authToken.permissions ?? [],
          isActive: authToken.isActive === true,
          employeeId: getStringOrNull(authToken.employeeId),
          employeeCode: getStringOrNull(authToken.employeeCode),
          departmentId: getStringOrNull(authToken.departmentId),
          managerId: getStringOrNull(authToken.managerId),
        }
      }

      return session
    },

    /**
     * Controls whether a sign-in is allowed.
     * This runs on the Edge — keep it lightweight (no DB calls).
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublicPath = nextUrl.pathname.startsWith('/login')
      const isApiAuth = nextUrl.pathname.startsWith('/api/auth')
      const isCron = nextUrl.pathname.startsWith('/api/cron')

      if (isApiAuth || isCron) return true
      if (isPublicPath) return true
      if (isLoggedIn) return true

      // Redirect unauthenticated users to login
      return false
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },

  trustHost: true,
}
