import { z } from 'zod'

/**
 * Server-side environment variable schema.
 * All variables are validated at startup — missing vars throw immediately.
 * NEVER import this file in client-side code.
 */
const serverEnvSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),

  // Auth.js
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  AUTH_URL: z.string().url('AUTH_URL must be a valid URL'),

  // Google Service Account
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email('GOOGLE_SERVICE_ACCOUNT_EMAIL must be a valid email'),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().min(1, 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is required'),
  GOOGLE_SERVICE_ACCOUNT_CLIENT_ID: z.string().min(1, 'GOOGLE_SERVICE_ACCOUNT_CLIENT_ID is required'),
  GOOGLE_ADMIN_EMAIL: z.string().email('GOOGLE_ADMIN_EMAIL must be a valid email'),

  // Google Resources
  GOOGLE_DRIVE_SHARED_FOLDER_ID: z.string().min(1, 'GOOGLE_DRIVE_SHARED_FOLDER_ID is required'),
  GOOGLE_CALENDAR_ID: z.string().default('primary'),

  // Cron Security
  CRON_SECRET: z.string().min(32, 'CRON_SECRET must be at least 32 characters'),
})

/**
 * Public (client-accessible) environment variable schema.
 * Only NEXT_PUBLIC_* vars belong here.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_APP_NAME: z.string().default('SDC Workspace'),
})

// Parse and validate — throws ZodError with descriptive messages on failure
function parseEnv<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
  const result = schema.safeParse(process.env)
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors
    const message = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n')
    throw new Error(`Environment variable validation failed:\n${message}`)
  }
  return result.data as z.infer<T>
}

// Lazy parse — only runs on first access to avoid build-time failures in CI
let _serverEnv: z.infer<typeof serverEnvSchema> | null = null
let _clientEnv: z.infer<typeof clientEnvSchema> | null = null

export function getServerEnv(): z.infer<typeof serverEnvSchema> {
  if (!_serverEnv) {
    _serverEnv = parseEnv(serverEnvSchema)
  }
  return _serverEnv
}

export function getClientEnv(): z.infer<typeof clientEnvSchema> {
  if (!_clientEnv) {
    _clientEnv = parseEnv(clientEnvSchema)
  }
  return _clientEnv
}

// Convenience export for server-side code
export const env = new Proxy({} as z.infer<typeof serverEnvSchema>, {
  get(_, key: string) {
    return getServerEnv()[key as keyof z.infer<typeof serverEnvSchema>]
  },
})
