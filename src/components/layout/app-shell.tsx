import type { Session } from 'next-auth'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface AppShellProps {
  children: React.ReactNode
  session: Session
}

/**
 * Root layout shell for all authenticated pages.
 * Composes Sidebar + Topbar + main content area.
 */
export function AppShell({ children, session }: AppShellProps) {
  return (
    <div className="bg-background flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile, collapsible on tablet */}
      <Sidebar session={session} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar session={session} />
        <main
          className="flex-1 overflow-y-auto p-6"
          id="main-content"
          role="main"
          aria-label="Main content"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
