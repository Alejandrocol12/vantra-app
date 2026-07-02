import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const movement = await prisma.movement.findUnique({ where: { id: params.id } })
  if (!movement) return NextResponse.json({ error: 'Movimiento no encontrado.' }, { status: 404 })
  await prisma.movement.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
