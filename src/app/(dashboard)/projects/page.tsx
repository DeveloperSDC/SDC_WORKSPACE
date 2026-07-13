import type { Metadata } from 'next'

import { db } from '@/lib/db/prisma'
import { requireAuth, hasPermission } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { PageHeader } from '@/components/layout/page-header'
import { ProjectCard, type ProjectCardData } from './components/ProjectCard'
import { CreateProjectDialog } from './components/CreateProjectDialog'

export const metadata: Metadata = {
  title: 'Projects',
}

function formatDate(value: Date): string {
  return value.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function ProjectsPage() {
  const user = await requireAuth()
  const canReadAll = hasPermission(user, PERMISSIONS.PROJECTS_READ_ALL)
  const canManage = hasPermission(user, PERMISSIONS.PROJECTS_UPDATE_ALL)
  const canCreate = hasPermission(user, PERMISSIONS.PROJECTS_CREATE_ALL)
  const employeeId = user.employeeId

  if (!canReadAll && !employeeId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="Projects" description="Plan and track project delivery." />
        <p className="text-muted-foreground text-sm">
          Your account is not linked to an employee record, so projects are unavailable.
        </p>
      </div>
    )
  }

  const [projects, employees] = await Promise.all([
    db.project.findMany({
      where: {
        isDeleted: false,
        ...(canReadAll || !employeeId
          ? {}
          : {
              OR: [{ managerId: employeeId }, { members: { some: { employeeId } } }],
            }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        manager: { include: { user: { select: { name: true } } } },
        milestones: { select: { status: true } },
        _count: { select: { members: true } },
      },
    }),

    db.employee.findMany({
      where: { isDeleted: false, status: 'ACTIVE' },
      orderBy: { user: { name: 'asc' } },
      select: { id: true, user: { select: { name: true } } },
    }),
  ])

  const cards: ProjectCardData[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    managerName: project.manager.user.name,
    memberCount: project._count.members,
    milestonesTotal: project.milestones.length,
    milestonesDone: project.milestones.filter((m) => m.status === 'COMPLETED').length,
    dateRange:
      project.startDate && project.endDate
        ? `${formatDate(project.startDate)} – ${formatDate(project.endDate)}`
        : project.startDate
          ? `From ${formatDate(project.startDate)}`
          : null,
  }))

  const employeeOptions = employees.map((employee) => ({
    id: employee.id,
    name: employee.user.name,
  }))

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Projects"
        description="Plan and track project delivery."
        actions={canCreate ? <CreateProjectDialog employees={employeeOptions} /> : undefined}
      />

      {cards.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center">
          <p className="text-muted-foreground text-sm">No projects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((project) => (
            <ProjectCard key={project.id} project={project} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  )
}
