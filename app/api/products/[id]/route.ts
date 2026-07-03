import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId()
    const body = await request.json()
    const product = await prisma.product.update({
      where: { id: params.id, userId },
      data: {
        name: String(body.name).trim(),
        category: String(body.category),
        flavor: body.flavor ? String(body.flavor).trim() : null,
        puffs: body.puffs ? Number(body.puffs) : null,
        stock: Number(body.stock) || 0,
        minStock: Number(body.minStock) || 0,
        cost: Number(body.cost) || 0,
        price: Number(body.price) || 0,
      },
      include: { variants: { orderBy: { label: 'asc' } } },
    })
    return NextResponse.json(product)
  } catch { return unauthorized() }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserId()
    await prisma.product.delete({ where: { id: params.id, userId } })
    return NextResponse.json({ ok: true })
  } catch { return unauthorized() }
}
