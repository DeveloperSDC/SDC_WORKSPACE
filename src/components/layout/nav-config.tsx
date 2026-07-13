import {
  LayoutDashboard,
  Users,
  Clock,
  CheckSquare,
  FolderKanban,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import type { PermissionKey } from '@lib/constants/permissions.constants'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** If specified, user must have at least one of these permissions to see this item */
  requiredPermissions?: PermissionKey[]
  badge?: string
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

/**
 * Navigation is limited to the modules that are actually implemented.
 * Unbuilt features (Leave, Meetings, CRM, Documents, Reports, Notifications,
 * Settings) are intentionally omitted until they ship.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'People',
    items: [
      {
        label: 'Employees',
        href: '/employees',
        icon: Users,
        requiredPermissions: ['employees:read:own', 'employees:read:team', 'employees:read:all'],
      },
      {
        label: 'Attendance',
        href: '/attendance',
        icon: Clock,
        requiredPermissions: ['attendance:read:own', 'attendance:read:team', 'attendance:read:all'],
      },
    ],
  },
  {
    title: 'Work',
    items: [
      {
        label: 'Tasks',
        href: '/tasks',
        icon: CheckSquare,
        requiredPermissions: ['tasks:read:own', 'tasks:read:team', 'tasks:read:all'],
      },
      {
        label: 'Projects',
        href: '/projects',
        icon: FolderKanban,
        requiredPermissions: ['projects:read:own', 'projects:read:all'],
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Access Management',
        href: '/admin',
        icon: Shield,
        requiredPermissions: ['admin:read:all'],
      },
    ],
  },
]
