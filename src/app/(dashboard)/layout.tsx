import { redirect } from 'next/navigation'
import { auth } from '@lib/auth/auth'
import { AppShell } from '@components/layout/app-shell'

/**
 * Authenticated dashboard layout.
 * Wraps all dashboard pages with the sidebar + topbar shell.
 * Validates session — redirects to login if missing or inactive.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (!session.user.isActive) {
    redirect('/login?error=AccountInactive')
  }

  return <AppShell session={session}>{children}</AppShell>
}
