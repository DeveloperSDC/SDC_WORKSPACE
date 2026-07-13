import pino from 'pino'

/**
 * Structured logger using Pino.
 * In production: outputs JSON to stdout (Vercel captures this).
 * In development: pretty-prints to console.
 *
 * NEVER log secrets, tokens, passwords, or PII.
 */
const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  base: {
    service: 'sdc-workspace',
    env: process.env.NODE_ENV,
  },
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
})

/**
 * Creates a child logger with module context attached to every log entry.
 *
 * @example
 * const log = createLogger('employees')
 * log.info({ employeeId: '123' }, 'Employee created')
 */
export function createLogger(module: string): pino.Logger {
  return logger.child({ module })
}

export type Logger = pino.Logger
