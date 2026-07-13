import { redirect } from 'next/navigation'
import { auth } from '@lib/auth/auth'

/**
 * Root page: redirect authenticated users to dashboard, unauthenticated to login.
 * Middleware handles most redirects — this is a fallback.
 */
export default async function RootPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }
  redirect('/login')
}
