import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns'

export const dynamic = 'force-dynamic'

const COL = 5 * 60 * 60 * 1000
function colStart(fn: (d: Date) => Date): Date {
  const now = new Date()
  const local = new Date(now.getTime() - COL)
  return new Date(fn(local).getTime() + COL)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? 'month'

  let gte: Date | undefined
  if (period === 'today') gte = colStart(startOfDay)
  else if (period === 'week') gte = colStart(d => startOfWeek(d, { weekStartsOn: 1 }))
  else if (period === 'month') gte = colStart(startOfMonth)

  const gastos = await prisma.gasto.findMany({
    where: gte ? { date: { gte } } : undefined,
    orderBy: { date: 'desc' },
  })

  const total = gastos.reduce((s, g) => s + g.amount, 0)
  const byCategory = gastos.reduce<Record<string, number>>((acc, g) => {
    acc[g.category] = (acc[g.category] ?? 0) + g.amount
    return acc
  }, {})

  return NextResponse.json({ gastos, total, byCategory })
}

export async function POST(request: Request) {
  const { description, category, amount, date, note } = await request.json()
  if (!description?.trim() || !category || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Completa los campos requeridos.' }, { status: 400 })
  }
  const gasto = await prisma.gasto.create({
    data: {
      description: description.trim(),
      category,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      note: note?.trim() || null,
    },
  })
  return NextResponse.json(gasto, { status: 201 })
}
