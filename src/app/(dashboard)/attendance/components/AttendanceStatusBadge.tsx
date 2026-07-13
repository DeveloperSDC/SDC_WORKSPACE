import type { AttendanceStatus } from '@prisma/client'

import { Badge } from '@/components/ui/badge'

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-green-100 text-green-700 border-green-200',
  ABSENT: 'bg-red-100 text-red-700 border-red-200',
  LATE: 'bg-amber-100 text-amber-700 border-amber-200',
  HALF_DAY: 'bg-orange-100 text-orange-700 border-orange-200',
  WFH: 'bg-blue-100 text-blue-700 border-blue-200',
  HOLIDAY: 'bg-purple-100 text-purple-700 border-purple-200',
  WEEKLY_OFF: 'bg-gray-100 text-gray-700 border-gray-200',
  ON_LEAVE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

function label(status: AttendanceStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {label(status)}
    </Badge>
  )
}
