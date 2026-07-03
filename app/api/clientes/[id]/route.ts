import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId()
    const cliente = await prisma.cliente.findFirst({
      where: { id: params.id, userId },
      include: { sales: { where: { payment: 'Fiado' }, orderBy: { date: 'desc' } }, abonos: { orderBy: { date: 'desc' } } },
    })
    if (!cliente) return NextResponse.json({ error: 'No encontrado.' }, { status: 404 })
    return NextResponse.json(cliente)
  } catch { return unauthorized() }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId()
    const { name, phone, note, limiteCredito } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 })
    const cliente = await prisma.cliente.update({
      where: { id: params.id, userId },
      data: { name: name.trim(), phone: phone?.trim() || null, note: note?.trim() || null, limiteCredito: limiteCredito ? Number(limiteCredito) : null },
    })
    return NextResponse.json(cliente)
  } catch { return unauthorized() }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId()
    await prisma.cliente.delete({ where: { id: params.id, userId } })
    return NextResponse.json({ ok: true })
  } catch { return unauthorized() }
}
