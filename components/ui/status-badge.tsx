import { cn } from '@/lib/utils'
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import type { CaseCategory, CaseStatus } from '@/lib/database.types'

interface CategoryBadgeProps {
  category: CaseCategory
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
      CATEGORY_COLORS[category],
      className
    )}>
      {CATEGORY_LABELS[category]}
    </span>
  )
}

interface StatusBadgeProps {
  status: CaseStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
      STATUS_COLORS[status],
      className
    )}>
      {STATUS_LABELS[status]}
    </span>
  )
}
