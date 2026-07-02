import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'sales'
  const period = searchParams.get('period') ?? 'daily'

  const now = new Date()
  let start: Date

  if (period === 'weekly') {
    start = startOfWeek(now, { weekStartsOn: 1 })
  } else if (period === 'monthly') {
    start = startOfMonth(now)
  } else {
    start = startOfDay(now)
  }

  const [products, periodSales] = await Promise.all([
    prisma.product.findMany({
      include: { variants: { orderBy: { label: 'asc' } } },
      orderBy: { category: 'asc' },
    }),
    type === 'sales'
      ? prisma.sale.findMany({ where: { date: { gte: start }, status: 'activa' }, orderBy: { date: 'desc' } })
      : Promise.resolve([]),
  ])

  let lowStockCount = 0
  for (const p of products) {
    if (p.hasVariants) {
      if (p.variants.some(v => v.stock <= v.minStock)) lowStockCount++
    } else {
      if (p.stock <= p.minStock) lowStockCount++
    }
  }

  if (type === 'inventory') {
    return NextResponse.json({
      type, period, products, sales: [],
      summary: { totalSales: 0, units: 0, profit: 0, lowStock: lowStockCount },
    })
  }

  const summary = {
    totalSales: periodSales.reduce((s, sale) => s + sale.total, 0),
    units: periodSales.reduce((s, sale) => s + sale.quantity, 0),
    profit: periodSales.reduce((s, sale) => s + sale.profit, 0),
    lowStock: lowStockCount,
  }

  return NextResponse.json({ type, period, products: [], sales: periodSales, summary })
}
