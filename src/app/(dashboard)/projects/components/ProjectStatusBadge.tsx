import type { ProjectStatus } from '@prisma/client'

import { Badge } from '@/components/ui/badge'

const STATUS_STYLES: Record<ProjectStatus, string> = {
  PLANNING: 'bg-blue-100 text-blue-700 border-blue-200',
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  ON_HOLD: 'bg-amber-100 text-amber-700 border-amber-200',
  COMPLETED: 'bg-purple-100 text-purple-700 border-purple-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}

export function projectStatusLabel(status: ProjectStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {projectStatusLabel(status)}
    </Badge>
  )
}
