import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { name, phone, note, limiteCredito } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 })
  const cliente = await prisma.cliente.update({
    where: { id: params.id },
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      note: note?.trim() || null,
      limiteCredito: limiteCredito ? Number(limiteCredito) : null,
    },
  })
  return NextResponse.json(cliente)
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      sales:  { where: { payment: 'Fiado' }, orderBy: { date: 'desc' } },
      abonos: { orderBy: { date: 'desc' } },
    },
  })
  if (!cliente) return NextResponse.json({ error: 'No encontrado.' }, { status: 404 })
  return NextResponse.json(cliente)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.cliente.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
