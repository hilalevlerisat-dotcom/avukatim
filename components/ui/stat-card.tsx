import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/constants'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  gradient?: 'blue' | 'green' | 'red' | 'amber' | 'purple'
  trend?: { value: number; label: string }
  currency?: boolean
  className?: string
}

const GRADIENT_MAP = {
  blue: 'stat-gradient-blue',
  green: 'stat-gradient-green',
  red: 'stat-gradient-red',
  amber: 'stat-gradient-amber',
  purple: 'stat-gradient-purple',
}

const ICON_COLORS = {
  blue: 'text-indigo-500 dark:text-indigo-400',
  green: 'text-emerald-500 dark:text-emerald-400',
  red: 'text-red-500 dark:text-red-400',
  amber: 'text-amber-500 dark:text-amber-400',
  purple: 'text-violet-500 dark:text-violet-400',
}

const ICON_BG = {
  blue: 'bg-indigo-500/10 dark:bg-indigo-500/20',
  green: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  red: 'bg-red-500/10 dark:bg-red-500/20',
  amber: 'bg-amber-500/10 dark:bg-amber-500/20',
  purple: 'bg-violet-500/10 dark:bg-violet-500/20',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient = 'blue',
  trend,
  currency = false,
  className,
}: StatCardProps) {
  const displayValue = currency && typeof value === 'number'
    ? formatCurrency(value)
    : value.toLocaleString('tr-TR')

  return (
    <div className={cn(
      'rounded-2xl border p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
      GRADIENT_MAP[gradient],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', ICON_BG[gradient])}>
          <Icon className={cn('w-5 h-5', ICON_COLORS[gradient])} />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
            trend.value > 0
              ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400'
              : trend.value < 0
              ? 'text-red-600 bg-red-500/10 dark:text-red-400'
              : 'text-muted-foreground bg-muted'
          )}>
            {trend.value > 0 ? <TrendingUp className="w-3 h-3" /> : trend.value < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {trend.label}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground tabular-nums">{displayValue}</p>
        <p className="text-sm font-medium text-foreground/70 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
