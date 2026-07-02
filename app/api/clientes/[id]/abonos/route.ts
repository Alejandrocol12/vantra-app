import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { amount, note } = await request.json()
  if (!amount || Number(amount) <= 0) {
    return NextResponse.json({ error: 'El monto debe ser mayor a 0.' }, { status: 400 })
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      sales: { where: { payment: 'Fiado', status: 'activa' }, select: { total: true } },
      abonos: { select: { amount: true } },
    },
  })
  if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 })

  const totalFiado = cliente.sales.reduce((s, x) => s + x.total, 0)
  const totalAbonado = cliente.abonos.reduce((s, a) => s + a.amount, 0)
  const deuda = totalFiado - totalAbonado

  if (Number(amount) > deuda) {
    return NextResponse.json({ error: `El abono ($${Number(amount).toLocaleString()}) supera la deuda actual ($${deuda.toLocaleString()}).` }, { status: 400 })
  }

  const abono = await prisma.abono.create({
    data: { clienteId: params.id, amount: Number(amount), note: note?.trim() || null },
  })
  return NextResponse.json(abono, { status: 201 })
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const abonos = await prisma.abono.findMany({
    where: { clienteId: params.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(abonos)
}
