'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Session } from 'next-auth'
import { cn } from '@/lib/utils'
import { NAV_SECTIONS } from './nav-config'
import type { PermissionKey } from '@/lib/constants/permissions.constants'

interface SidebarProps {
  session: Session
}

/**
 * Application sidebar navigation.
 * Filters navigation items based on the user's permissions.
 * Highlights the active route.
 */
export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname()

  const userPermissions = new Set((session.user.permissions ?? []) as PermissionKey[])

  return (
    <aside
      className="bg-card border-border hidden w-64 flex-shrink-0 flex-col border-r lg:flex"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="border-border flex h-16 items-center gap-3 border-b px-5">
        <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
          <span className="text-primary-foreground text-sm font-bold">S</span>
        </div>
        <span className="text-foreground text-sm font-semibold">SDC Workspace</span>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-4" role="navigation">
        {NAV_SECTIONS.map((section, sectionIdx) => {
          const visibleItems = section.items.filter((item) => {
            // Temporary: Super Admin can see everything
            if (session.user.role === 'SUPER_ADMIN') {
              return true
            }

            if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
              return true
            }

            return item.requiredPermissions.some((p) => userPermissions.has(p as PermissionKey))
          })

          if (visibleItems.length === 0) return null

          return (
            <div key={sectionIdx} className="mb-2">
              {section.title && (
                <p className="text-muted-foreground mb-1 px-4 text-[11px] font-semibold tracking-wider uppercase">
                  {section.title}
                </p>
              )}
              <ul role="list" className="space-y-0.5 px-2">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.href)

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <item.icon
                          className={cn(
                            'h-4 w-4 flex-shrink-0',
                            isActive
                              ? 'text-primary'
                              : 'text-muted-foreground group-hover:text-foreground',
                          )}
                          aria-hidden="true"
                        />
                        {item.label}
                        {item.badge && (
                          <span className="bg-primary text-primary-foreground ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* User info at bottom */}
      <div className="border-border border-t p-4">
        <div className="flex items-center gap-3">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? ''}
              className="h-8 w-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
              <span className="text-muted-foreground text-xs font-medium">
                {(session.user.name ?? 'U')[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">{session.user.name}</p>
            <p className="text-muted-foreground truncate text-xs">{session.user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
