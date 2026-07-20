import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { db } from '@/lib/db/prisma'
import { requireAuth, hasPermission } from '@/lib/auth/guards'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { Button } from '@/components/ui/button'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'
import { MembersManager } from './components/MembersManager'
import { MilestonesManager } from './components/MilestonesManager'
import { ProjectTasks } from './components/ProjectTasks'
import { ProjectDocuments } from './components/ProjectDocuments'

export const metadata: Metadata = {
  title: 'Project',
}

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params
  const user = await requireAuth()
  const canReadAll = hasPermission(user, PERMISSIONS.PROJECTS_READ_ALL)
  const canManage = hasPermission(user, PERMISSIONS.PROJECTS_UPDATE_ALL)

  const project = await db.project.findFirst({
    where: { id, isDeleted: false },
    include: {
      manager: { include: { user: { select: { name: true } } } },
      members: {
        include: { employee: { include: { user: { select: { name: true } } } } },
        orderBy: { joinedAt: 'asc' },
      },
      milestones: { orderBy: { dueDate: 'asc' } },
      tasks: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        include: {
          assignees: { include: { employee: { include: { user: { select: { name: true } } } } } },
        },
      },
      _count: { select: { tasks: true } },
    },
  })

  if (!project) {
    notFound()
  }

  // Employees who can read only their own projects must belong to this one.
  if (!canReadAll) {
    const isMember =
      project.managerId === user.employeeId ||
      project.members.some((member) => member.employeeId === user.employeeId)

    if (!isMember) {
      notFound()
    }
  }

  const assignableEmployees = await db.employee.findMany({
    where: {
      isDeleted: false,
      status: 'ACTIVE',
      id: { notIn: project.members.map((member) => member.employeeId) },
    },
    orderBy: { user: { name: 'asc' } },
    select: { id: true, user: { select: { name: true } } },
  })

  // Managers/admins see every document; other members only see team-visible ones.
  const canManageDocs = canManage || project.managerId === user.employeeId

  const documents = await db.projectDocument.findMany({
    where: {
      projectId: project.id,
      ...(canManageDocs ? {} : { isVisibleToTeam: true }),
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to projects"
          nativeButton={false}
          render={<Link href="/projects" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-1 items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground text-sm">
              Manager: {project.manager.user.name} · {project._count.tasks} tasks
            </p>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>

      {project.description ? (
        <p className="text-muted-foreground max-w-3xl text-sm">{project.description}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MembersManager
          projectId={project.id}
          canManage={canManage}
          members={project.members.map((member) => ({
            employeeId: member.employeeId,
            name: member.employee.user.name,
            role: member.role,
          }))}
          assignableEmployees={assignableEmployees.map((employee) => ({
            id: employee.id,
            name: employee.user.name,
          }))}
        />

        <MilestonesManager
          projectId={project.id}
          canManage={canManage}
          milestones={project.milestones.map((milestone) => ({
            id: milestone.id,
            title: milestone.title,
            description: milestone.description,
            dueDate: milestone.dueDate.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            status: milestone.status,
          }))}
        />

        <ProjectTasks
          projectId={project.id}
          canManageTasks={canManage || project.managerId === user.employeeId}
          currentEmployeeId={user.employeeId}
          members={project.members.map((member) => ({
            id: member.employeeId,
            name: member.employee.user.name,
          }))}
          tasks={project.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate
              ? task.dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
              : null,
            assigneeIds: task.assignees.map((a) => a.employeeId),
            assigneeNames: task.assignees.map((a) => a.employee.user.name),
          }))}
        />

        <ProjectDocuments
          projectId={project.id}
          canManage={canManageDocs}
          documents={documents.map((doc) => ({
            id: doc.id,
            title: doc.title,
            url: doc.url,
            description: doc.description,
            isVisibleToTeam: doc.isVisibleToTeam,
          }))}
        />
      </div>
    </div>
  )
}
