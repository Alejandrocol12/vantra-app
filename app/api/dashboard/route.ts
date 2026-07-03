import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, startOfMonth, startOfWeek, subDays, format } from 'date-fns'

export const dynamic = 'force-dynamic'

// Colombia = UTC-5: shift "now" to local time for day/month boundaries
const COL_OFFSET_MS = 5 * 60 * 60 * 1000
function colStartOfDay(d: Date) {
  const local = new Date(d.getTime() - COL_OFFSET_MS)
  const midnight = startOfDay(local)
  return new Date(midnight.getTime() + COL_OFFSET_MS)
}
function colStartOfMonth(d: Date) {
  const local = new Date(d.getTime() - COL_OFFSET_MS)
  const m = startOfMonth(local)
  return new Date(m.getTime() + COL_OFFSET_MS)
}
function colStartOfWeek(d: Date) {
  const local = new Date(d.getTime() - COL_OFFSET_MS)
  const w = startOfWeek(local, { weekStartsOn: 1 })
  return new Date(w.getTime() + COL_OFFSET_MS)
}

export async function GET() {
  const now = new Date()
  const todayStart = colStartOfDay(now)
  const monthStart = colStartOfMonth(now)
  const weekStart = colStartOfWeek(now)
  const sevenDaysAgo = new Date(colStartOfDay(subDays(now, 6)).getTime())

  const activeOnly = { status: 'activa' }

  const [todayAgg, monthAgg, products, recentSales, weekSales, topRaw, clientes] = await Promise.all([
    prisma.sale.aggregate({
      where: { date: { gte: todayStart }, ...activeOnly },
      _sum: { total: true, quantity: true },
    }),
    prisma.sale.aggregate({
      where: { date: { gte: monthStart }, ...activeOnly },
      _sum: { total: true },
      _count: true,
    }),
    prisma.product.findMany({
      include: { variants: { select: { stock: true, minStock: true, price: true } } },
    }),
    prisma.sale.findMany({
      where: activeOnly,
      orderBy: { date: 'desc' },
      take: 6,
      select: { id: true, productName: true, variantLabel: true, quantity: true, payment: true, total: true, date: true },
    }),
    prisma.sale.findMany({
      where: { date: { gte: sevenDaysAgo }, ...activeOnly },
      select: { total: true, date: true, payment: true },
    }),
    prisma.sale.groupBy({
      by: ['productId', 'productName'],
      where: { date: { gte: weekStart }, ...activeOnly },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.cliente.findMany({
      include: {
        sales: { where: { payment: 'Fiado', ...activeOnly }, select: { total: true } },
        abonos: { select: { amount: true } },
      },
    }),
  ])

  const productList = products as any[]
  const inventoryValue = productList.reduce((s: number, p: any) => {
    if (p.hasVariants) {
      return s + (p.variants as any[]).reduce((vs: number, v: any) => vs + v.stock * v.price, 0)
    }
    return s + p.stock * p.price
  }, 0)

  const lowStockProducts = productList.filter((p: any) => {
    if (p.hasVariants) return (p.variants as any[]).some((v: any) => v.minStock > 0 && v.stock < v.minStock)
    return p.minStock > 0 && p.stock < p.minStock
  })

  const totalDeudaFiado = clientes.reduce((s, c) => {
    const fiado = c.sales.reduce((fs, sale) => fs + sale.total, 0)
    const abonado = c.abonos.reduce((as, a) => as + a.amount, 0)
    return s + Math.max(0, fiado - abonado)
  }, 0)

  const clientesConDeuda = clientes.filter(c => {
    const fiado = c.sales.reduce((s, sale) => s + sale.total, 0)
    const abonado = c.abonos.reduce((s, a) => s + a.amount, 0)
    return fiado - abonado > 0
  }).length

  const salesByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    salesByDay[format(subDays(now, i), 'dd/MM')] = 0
  }
  weekSales.forEach(s => {
    const key = format(new Date(s.date), 'dd/MM')
    if (key in salesByDay) salesByDay[key] += s.total
  })

  const paymentMap: Record<string, number> = {}
  weekSales.forEach(s => {
    paymentMap[s.payment] = (paymentMap[s.payment] ?? 0) + s.total
  })

  const productMap = new Map(productList.map((p: any) => [p.id, p]))
  const topProducts = topRaw.map(r => ({
    productId: r.productId,
    productName: r.productName,
    units: r._sum.quantity ?? 0,
    revenue: r._sum.total ?? 0,
    stock: (productMap.get(r.productId) as any)?.stock ?? 0,
    minStock: (productMap.get(r.productId) as any)?.minStock ?? 0,
    category: (productMap.get(r.productId) as any)?.category ?? '',
  }))

  return NextResponse.json({
    today: { total: todayAgg._sum.total ?? 0, units: todayAgg._sum.quantity ?? 0 },
    month: { total: monthAgg._sum.total ?? 0, count: monthAgg._count },
    inventory: { value: inventoryValue, lowStockCount: lowStockProducts.length, lowStockProducts },
    fiado: { totalDeuda: totalDeudaFiado, clientesConDeuda },
    recentSales,
    topProducts,
    charts: {
      salesByDay: Object.entries(salesByDay).map(([day, total]) => ({ day, total })),
      paymentMethods: Object.entries(paymentMap).map(([method, total]) => ({ method, total })),
    },
  })
}
