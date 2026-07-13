import type { TaskPriority } from '@prisma/client'

import { Badge } from '@/components/ui/badge'

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
  HIGH: 'bg-amber-100 text-amber-700 border-amber-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
}

function label(priority: TaskPriority): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase()
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant="outline" className={PRIORITY_STYLES[priority]}>
      {label(priority)}
    </Badge>
  )
}
