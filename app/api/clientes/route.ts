import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userId = await getUserId()
    const clientes = await prisma.cliente.findMany({
      where: { userId },
      include: {
        sales:  { select: { total: true, payment: true, date: true, status: true } },
        abonos: { select: { amount: true, date: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    const result = clientes.map(c => {
      const fiadoSales = c.sales.filter(s => s.payment === 'Fiado' && s.status !== 'anulada')
      const totalFiado = fiadoSales.reduce((s, x) => s + x.total, 0)
      const totalAbonado = c.abonos.reduce((s, a) => s + a.amount, 0)
      const lastSale = c.sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      return { id: c.id, name: c.name, phone: c.phone, note: c.note, limiteCredito: c.limiteCredito, createdAt: c.createdAt, totalFiado, totalAbonado, deuda: totalFiado - totalAbonado, lastSale: lastSale?.date ?? null, salesCount: fiadoSales.length }
    })
    return NextResponse.json(result)
  } catch { return unauthorized() }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    const { name, phone, note, limiteCredito } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 })
    const cliente = await prisma.cliente.create({
      data: { userId, name: name.trim(), phone: phone?.trim() || null, note: note?.trim() || null, limiteCredito: limiteCredito ? Number(limiteCredito) : null },
    })
    return NextResponse.json(cliente, { status: 201 })
  } catch { return unauthorized() }
}
