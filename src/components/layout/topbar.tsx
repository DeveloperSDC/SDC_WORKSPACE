'use client'

import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'
import { LogOut, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopbarProps {
  session: Session
}

/**
 * Application top navigation bar.
 * Contains: notifications bell, theme toggle, user menu.
 *
 * Note: This uses Base UI components (shadcn "nova" style).
 * Base UI does not support asChild — use native <a> or <Link> inside menu items.
 */
export function Topbar({ session }: TopbarProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header
      className="bg-card border-border flex h-16 flex-shrink-0 items-center justify-between border-b px-6"
      role="banner"
    >
      {/* Left — mobile branding */}
      <div className="text-muted-foreground text-sm lg:hidden">SDC Workspace</div>
      <div className="hidden lg:block" />

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun
            className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
            aria-hidden="true"
          />
          <Moon
            className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
            aria-hidden="true"
          />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="User menu"
            className="hover:bg-muted focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? ''}
                className="h-8 w-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                <span className="text-primary-foreground text-xs font-medium">
                  {(session.user.name ?? 'U')[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm leading-none font-medium">{session.user.name}</p>
                  <p className="text-muted-foreground text-xs leading-none">{session.user.email}</p>
                  <p className="text-muted-foreground text-xs leading-none capitalize">
                    {session.user.role?.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
