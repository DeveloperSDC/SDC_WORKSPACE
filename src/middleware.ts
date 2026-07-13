import NextAuth from 'next-auth'
import { authConfig } from '@lib/auth/auth.config'
import { NextResponse } from 'next/server'

/**
 * Auth.js v5 edge-compatible middleware.
 * We pass only authConfig (no Prisma adapter, no Node.js modules)
 * so this runs cleanly on the Vercel Edge Runtime.
 */
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth as { user?: { role?: string; isActive?: boolean } } | null

  // ── Cron routes: validate CRON_SECRET header ──────────────────────────
  if (nextUrl.pathname.startsWith('/api/cron')) {
    const authHeader = req.headers.get('authorization')
    const expected = `Bearer ${process.env.CRON_SECRET}`
    if (authHeader !== expected) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 },
      )
    }
    return addSecurityHeaders(NextResponse.next())
  }

  // ── Public routes: always allow ────────────────────────────────────────
  if (
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname === '/login' ||
    nextUrl.pathname === '/'
  ) {
    return addSecurityHeaders(NextResponse.next())
  }

  // ── Unauthenticated: redirect to login ────────────────────────────────
  if (!session?.user) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Inactive account: force logout ────────────────────────────────────
  if (session.user.isActive === false) {
    const loginUrl = new URL('/login', nextUrl.origin)
    loginUrl.searchParams.set('error', 'AccountInactive')
    return NextResponse.redirect(loginUrl)
  }

  // ── Admin routes: restrict by role ────────────────────────────────────
  const adminOnlyRoles = ['SUPER_ADMIN', 'ADMIN']
  if (
    nextUrl.pathname.startsWith('/admin') ||
    nextUrl.pathname.startsWith('/api/admin')
  ) {
    if (!session.user.role || !adminOnlyRoles.includes(session.user.role)) {
      if (nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
          { status: 403 },
        )
      }
      return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
    }
  }

  return addSecurityHeaders(NextResponse.next())
})

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    )
  }
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
