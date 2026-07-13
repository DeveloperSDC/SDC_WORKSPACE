import { handlers } from '@lib/auth/auth'

/**
 * Auth.js v5 route handler.
 * Handles: GET /api/auth/session, GET/POST /api/auth/signin, /api/auth/callback/*, etc.
 */
export const { GET, POST } = handlers
