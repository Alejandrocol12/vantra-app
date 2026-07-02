import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string
  subtitle?: string
  icon: LucideIcon
  variant?: 'default' | 'warning' | 'danger'
}

const variantStyles = {
  default: 'bg-white border-[rgba(0,0,0,0.1)]',
  warning: 'bg-amber-50 border-amber-200',
  danger: 'bg-red-50 border-red-200',
}

const iconStyles = {
  default: 'bg-brand-soft text-brand',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
}

export default function MetricCard({ label, value, subtitle, icon: Icon, variant = 'default' }: MetricCardProps) {
  return (
    <article className={cn('border rounded-xl p-5 shadow-sm', variantStyles[variant])}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted font-medium">{label}</span>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconStyles[variant])}>
          <Icon size={18} />
        </div>
      </div>
      <strong className="block text-2xl font-bold leading-tight mb-1">{value}</strong>
      {subtitle && <small className="text-muted text-xs">{subtitle}</small>}
    </article>
  )
}
