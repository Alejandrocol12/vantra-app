import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { getUserId, unauthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const COL_OFFSET_MS = 5 * 60 * 60 * 1000

function colStart(fn: (d: Date) => Date): Date {
  const now = new Date()
  const local = new Date(now.getTime() - COL_OFFSET_MS)
  const boundary = fn(local)
  return new Date(boundary.getTime() + COL_OFFSET_MS)
}

export async function GET(request: Request) {
  let userId: string
  try { userId = await getUserId() } catch { return unauthorized() }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'sales'
  const period = searchParams.get('period') ?? 'daily'

  let start: Date
  if (period === 'weekly') start = colStart(d => startOfWeek(d, { weekStartsOn: 1 }))
  else if (period === 'monthly') start = colStart(startOfMonth)
  else start = colStart(startOfDay)

  const [products, periodSales] = await Promise.all([
    prisma.product.findMany({
      where: { userId },
      include: { variants: { orderBy: { label: 'asc' } } },
      orderBy: { category: 'asc' },
    }),
    type === 'sales'
      ? prisma.sale.findMany({ where: { userId, date: { gte: start }, status: 'activa' }, orderBy: { date: 'desc' } })
      : Promise.resolve([]),
  ])

  // Flatten products + variants into uniform rows
  const productRows = products.flatMap(p => {
    if (p.hasVariants && p.variants.length > 0) {
      return p.variants.map(v => ({
        id: v.id,
        name: p.name,
        variantLabel: v.label,
        category: p.category,
        flavor: p.flavor ?? null,
        stock: v.stock,
        minStock: v.minStock,
        cost: v.cost,
        price: v.price,
      }))
    }
    return [{
      id: p.id,
      name: p.name,
      variantLabel: null as string | null,
      category: p.category,
      flavor: p.flavor ?? null,
      stock: p.stock,
      minStock: p.minStock,
      cost: p.cost,
      price: p.price,
    }]
  })

  // Only flag as low stock when minStock > 0 AND stock < minStock
  const lowStockCount = products.reduce((acc, p) => {
    if (p.hasVariants) {
      return acc + (p.variants.some(v => v.minStock > 0 && v.stock < v.minStock) ? 1 : 0)
    }
    return acc + (p.minStock > 0 && p.stock < p.minStock ? 1 : 0)
  }, 0)

  if (type === 'inventory') {
    return NextResponse.json({
      type, period, products: productRows, sales: [],
      summary: {
        totalSales: 0,
        units: productRows.reduce((s, r) => s + r.stock, 0),
        profit: productRows.reduce((s, r) => s + r.stock * r.cost, 0),
        inventoryValue: productRows.reduce((s, r) => s + r.stock * r.price, 0),
        lowStock: lowStockCount,
      },
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
