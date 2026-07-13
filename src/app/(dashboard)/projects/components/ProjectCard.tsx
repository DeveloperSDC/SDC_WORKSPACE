'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash2, Users, Flag } from 'lucide-react'

import type { ProjectStatus } from '@prisma/client'
import { softDeleteProject, updateProjectStatus } from '../actions'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { Button } from '@/components/ui/button'

export interface ProjectCardData {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  managerName: string
  memberCount: number
  milestonesTotal: number
  milestonesDone: number
  dateRange: string | null
}

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export function ProjectCard({
  project,
  canManage,
}: {
  project: ProjectCardData
  canManage: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const progress =
    project.milestonesTotal > 0
      ? Math.round((project.milestonesDone / project.milestonesTotal) * 100)
      : 0

  function changeStatus(status: ProjectStatus) {
    setError(null)
    startTransition(async () => {
      try {
        await updateProjectStatus(project.id, status)
      } catch (statusError) {
        setError(statusError instanceof Error ? statusError.message : 'Update failed.')
      }
    })
  }

  function remove() {
    if (!window.confirm(`Delete project "${project.name}"?`)) return
    setError(null)
    startTransition(async () => {
      try {
        await softDeleteProject(project.id)
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Delete failed.')
      }
    })
  }

  return (
    <div className="bg-card flex flex-col gap-3 rounded-xl border p-5">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/projects/${project.id}`} className="min-w-0 hover:underline">
          <h3 className="truncate font-semibold">{project.name}</h3>
        </Link>
        <ProjectStatusBadge status={project.status} />
      </div>

      {project.description ? (
        <p className="text-muted-foreground line-clamp-2 text-sm">{project.description}</p>
      ) : null}

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span>PM: {project.managerName}</span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {project.memberCount}
        </span>
        <span className="flex items-center gap-1">
          <Flag className="h-3.5 w-3.5" />
          {project.milestonesDone}/{project.milestonesTotal}
        </span>
        {project.dateRange ? <span>{project.dateRange}</span> : null}
      </div>

      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${progress}%` }} />
      </div>

      {canManage ? (
        <div className="flex items-center gap-2">
          <select
            value={project.status}
            disabled={pending}
            onChange={(event) => changeStatus(event.target.value as ProjectStatus)}
            className="border-input bg-background h-8 flex-1 rounded-md border px-2 text-xs"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            onClick={remove}
            aria-label="Delete project"
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
