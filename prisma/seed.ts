import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { ROLES, type RoleName } from '@/lib/constants/roles.constants'
import { PERMISSIONS } from '@/lib/constants/permissions.constants'
import { ROLE_PERMISSIONS } from '@/lib/permissions/permissions.map'

const prisma = new PrismaClient()

const ORG_DOMAIN = 'sdcindia01.com'

/**
 * Default password for the seeded accounts.
 * Override per environment with SEED_PASSWORD. Change it after first login.
 */
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'Admin@123'

const ROLE_DISPLAY_NAMES: Record<RoleName, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  HR: 'HR',
  FINANCE: 'Finance',
  SALES: 'Sales',
  TEAM_LEAD: 'Team Lead',
  EMPLOYEE: 'Employee',
  AUDITOR: 'Auditor',
}

async function main() {
  console.log('🌱 Starting database seed...')

  // ============================
  // ROLES
  // ============================

  const roleIds: Record<string, string> = {}

  for (const name of Object.values(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { displayName: ROLE_DISPLAY_NAMES[name], isSystem: true },
      create: { name, displayName: ROLE_DISPLAY_NAMES[name], isSystem: true },
    })

    roleIds[name] = role.id
  }

  console.log('✅ Roles seeded.')

  // ============================
  // PERMISSIONS
  // ============================

  const permissionIds: Record<string, string> = {}

  for (const key of Object.values(PERMISSIONS)) {
    const [module, action, condition] = key.split(':')

    if (!module || !action || !condition) {
      throw new Error(`Invalid permission format: ${key}`)
    }

    const permission = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, module, action, condition },
    })

    permissionIds[key] = permission.id
  }

  console.log('✅ Permissions seeded.')

  // ============================
  // ROLE ↔ PERMISSION MATRIX
  // Seeded straight from ROLE_PERMISSIONS so the DB never drifts
  // from the application's source of truth.
  // ============================

  for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIds[roleName]

    if (!roleId) {
      throw new Error(`Role not seeded: ${roleName}`)
    }

    for (const key of keys) {
      const permissionId = permissionIds[key]

      if (!permissionId) {
        throw new Error(`Permission not seeded: ${key}`)
      }

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      })
    }
  }

  console.log('✅ Role permissions seeded.')

  // ============================
  // DEPARTMENTS
  // ============================

  const departments = [
    { name: 'Engineering', code: 'ENG' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Marketing', code: 'MKT' },
    { name: 'Finance', code: 'FIN' },
    { name: 'Operations', code: 'OPS' },
  ]

  const departmentIds: Record<string, string> = {}

  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: { name: dept.name, code: dept.code, isActive: true, isDeleted: false },
    })

    departmentIds[dept.name] = department.id
  }

  console.log('✅ Departments seeded.')

  // ============================
  // DESIGNATIONS
  // ============================

  const designations = [
    { name: 'Software Developer', department: 'Engineering', level: 1 },
    { name: 'Frontend Developer', department: 'Engineering', level: 1 },
    { name: 'Backend Developer', department: 'Engineering', level: 1 },
    { name: 'Project Manager', department: 'Engineering', level: 3 },
    { name: 'HR Executive', department: 'Human Resources', level: 1 },
    { name: 'Marketing Executive', department: 'Marketing', level: 1 },
    { name: 'Finance Executive', department: 'Finance', level: 1 },
    { name: 'Intern', department: 'Engineering', level: 0 },
  ]

  const designationIds: Record<string, string> = {}

  for (const item of designations) {
    const departmentId = departmentIds[item.department]

    if (!departmentId) {
      throw new Error(`Department ID not found for ${item.department}`)
    }

    const existing = await prisma.designation.findFirst({
      where: { name: item.name, departmentId },
    })

    const designation = existing
      ? await prisma.designation.update({
          where: { id: existing.id },
          data: { level: item.level, isActive: true },
        })
      : await prisma.designation.create({
          data: { name: item.name, departmentId, level: item.level, isActive: true },
        })

    designationIds[item.name] = designation.id
  }

  console.log('✅ Designations seeded.')

  // ============================
  // USERS + EMPLOYEES
  // Every account (including Super Admin) needs an Employee record,
  // because credential login resolves users via employeeCode.
  // ============================

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12)

  const accounts = [
    {
      employeeCode: 'SDC0001',
      name: 'Super Admin',
      email: `admin@${ORG_DOMAIN}`,
      role: ROLES.SUPER_ADMIN,
      department: 'Engineering',
      designation: 'Project Manager',
    },
    {
      employeeCode: 'SDC0002',
      name: 'Demo Admin',
      email: `admin.demo@${ORG_DOMAIN}`,
      role: ROLES.ADMIN,
      department: 'Human Resources',
      designation: 'HR Executive',
    },
    {
      employeeCode: 'SDC0003',
      name: 'Demo Employee',
      email: `employee@${ORG_DOMAIN}`,
      role: ROLES.EMPLOYEE,
      department: 'Engineering',
      designation: 'Software Developer',
    },
  ]

  for (const account of accounts) {
    const roleId = roleIds[account.role]
    const departmentId = departmentIds[account.department]
    const designationId = designationIds[account.designation]

    if (!roleId || !departmentId || !designationId) {
      throw new Error(`Missing references for account ${account.employeeCode}`)
    }

    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        roleId,
        domain: ORG_DOMAIN,
        passwordHash,
        isActive: true,
        isDeleted: false,
      },
      create: {
        email: account.email,
        name: account.name,
        roleId,
        domain: ORG_DOMAIN,
        passwordHash,
        isActive: true,
      },
    })

    await prisma.employee.upsert({
      where: { employeeCode: account.employeeCode },
      update: {
        departmentId,
        designationId,
        status: 'ACTIVE',
        isDeleted: false,
      },
      create: {
        employeeCode: account.employeeCode,
        userId: user.id,
        departmentId,
        designationId,
        joiningDate: new Date(),
        status: 'ACTIVE',
      },
    })

    console.log(`   • ${account.role.padEnd(11)} ${account.employeeCode}  (${account.email})`)
  }

  console.log('✅ Users & employees seeded.')
  console.log(
    `\n🔑 Login with employee code + password "${SEED_PASSWORD}" (change after first login).`,
  )
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
