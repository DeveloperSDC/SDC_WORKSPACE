/**
 * Global API response types.
 * Import these in both Route Handlers and client-side query hooks.
 */

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
