/**
 * Re-exports cn from the canonical location (src/lib/utils.ts).
 * shadcn/ui components import from '@/lib/utils'.
 * Our app code can use either '@/lib/utils' or '@lib/utils/cn'.
 */
export { cn } from '../utils'
