import { cn } from '@/lib/utils'

interface StockBarProps {
  stock: number
  minStock: number
}

export function stockStatus(stock: number, minStock: number): 'ok' | 'low' | 'crit' | 'out' {
  if (minStock === 0) return 'ok'
  if (stock === 0) return 'out'
  if (stock < minStock) return 'crit'
  if (stock < minStock * 1.5) return 'low'
  return 'ok'
}

export function StockBadge({ stock, minStock }: StockBarProps) {
  const status = stockStatus(stock, minStock)
  const map = {
    ok:   { cls: 'badge-success', label: 'OK' },
    low:  { cls: 'badge-warn',    label: 'Bajo' },
    crit: { cls: 'badge-danger',  label: 'Crítico' },
    out:  { cls: 'badge-danger',  label: 'Agotado' },
  }
  const { cls, label } = map[status]
  return <span className={cn('badge', cls)}>{label}</span>
}

export default function StockBar({ stock, minStock }: StockBarProps) {
  const status = stockStatus(stock, minStock)
  const max = Math.max(minStock * 3, stock, 1)
  const pct = Math.min(100, (stock / max) * 100)
  const fillClass = status === 'ok' ? 's-ok' : status === 'low' ? 's-low' : 's-crit'
  return (
    <div className="stock-bar">
      <div className={cn('stock-fill', fillClass)} style={{ width: `${pct}%` }} />
    </div>
  )
}
