import { z } from 'zod'
import type { PaginationMeta } from './response'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationInput = z.infer<typeof paginationSchema>

/**
 * Calculates Prisma skip/take from page-based pagination input.
 */
export function getPrismaSkipTake(pagination: PaginationInput): {
  skip: number
  take: number
} {
  return {
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
  }
}

/**
 * Builds the pagination meta object for API responses.
 */
export function buildPaginationMeta(
  total: number,
  pagination: PaginationInput,
): PaginationMeta {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.ceil(total / pagination.pageSize),
  }
}
