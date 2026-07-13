import { type ZodError } from 'zod'
import { AppError } from '@lib/errors/app.error'

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Standard API response helpers.
 * All Route Handlers use these to ensure consistent response shapes.
 */
export const ApiResponse = {
  success<T>(data: T, status = 200): Response {
    const body: ApiSuccessResponse<T> = { success: true, data }
    return Response.json(body, { status })
  },

  created<T>(data: T): Response {
    const body: ApiSuccessResponse<T> = { success: true, data }
    return Response.json(body, { status: 201 })
  },

  paginated<T>(
    data: T[],
    meta: PaginationMeta,
  ): Response {
    const body: ApiSuccessResponse<T[]> = { success: true, data, meta }
    return Response.json(body, { status: 200 })
  },

  noContent(): Response {
    return new Response(null, { status: 204 })
  },

  error(code: string, message: string, status: number, details?: unknown): Response {
    const body: ApiErrorResponse = {
      success: false,
      error: { code, message, details },
    }
    return Response.json(body, { status })
  },

  /**
   * Maps AppError instances to HTTP responses.
   * Used in the catch block of every controller method.
   */
  fromError(error: unknown): Response {
    if (error instanceof AppError) {
      return ApiResponse.error(error.code, error.message, error.statusCode, error.details)
    }

    // Unhandled errors — do not expose internal details
    console.error('[Unhandled Error]', error)
    return ApiResponse.error('INTERNAL_ERROR', 'An unexpected error occurred', 500)
  },

  /**
   * Formats Zod validation errors into the standard error shape.
   */
  validationError(zodError: ZodError): Response {
    const details = zodError.flatten().fieldErrors
    return ApiResponse.error('VALIDATION_ERROR', 'Validation failed', 400, details)
  },
}
