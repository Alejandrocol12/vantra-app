import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const garantias = await prisma.garantia.findMany({
    orderBy: { date: 'desc' },
    include: { cliente: { select: { name: true } } },
  })
  return NextResponse.json(garantias)
}

export async function POST(request: Request) {
  const { productName, variantLabel, clienteId, issue } = await request.json()
  if (!productName?.trim()) return NextResponse.json({ error: 'El nombre del producto es requerido.' }, { status: 400 })
  if (!issue?.trim()) return NextResponse.json({ error: 'Describe el problema.' }, { status: 400 })

  const garantia = await prisma.garantia.create({
    data: {
      productName: productName.trim(),
      variantLabel: variantLabel?.trim() || null,
      clienteId: clienteId || null,
      issue: issue.trim(),
    },
    include: { cliente: { select: { name: true } } },
  })
  return NextResponse.json(garantia, { status: 201 })
}
