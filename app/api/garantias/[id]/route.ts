import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { status, resolution } = await request.json()
  const data: Record<string, unknown> = {}
  if (status) data.status = status
  if (resolution !== undefined) data.resolution = resolution || null
  if (status === 'resuelto' && !data.resolvedAt) data.resolvedAt = new Date()
  if (status !== 'resuelto') data.resolvedAt = null

  const g = await prisma.garantia.update({ where: { id: params.id }, data })
  return NextResponse.json(g)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.garantia.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
