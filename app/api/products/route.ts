import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userId = await getUserId()
    const products = await prisma.product.findMany({
      where: { userId },
      include: { variants: { orderBy: { label: 'asc' } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(products)
  } catch { return unauthorized() }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    const body = await request.json()

    if (!body.name || !body.category) {
      return NextResponse.json({ error: 'Nombre y categoría son obligatorios.' }, { status: 400 })
    }
    const price = Number(body.price)
    if (!body.hasVariants && (!price || price <= 0)) {
      return NextResponse.json({ error: 'El precio debe ser mayor a 0.' }, { status: 400 })
    }

    const trimmedName = String(body.name).trim()
    const existing = await prisma.product.findFirst({ where: { name: { equals: trimmedName }, userId } })
    if (existing) {
      return NextResponse.json({ error: `Ya existe un producto con el nombre "${trimmedName}".` }, { status: 409 })
    }

    const product = await prisma.product.create({
      data: {
        userId,
        name: trimmedName,
        category: String(body.category),
        flavor: body.flavor ? String(body.flavor).trim() : null,
        puffs: body.puffs ? Number(body.puffs) : null,
        stock: Number(body.stock) || 0,
        minStock: Number(body.minStock) || 0,
        cost: Number(body.cost) || 0,
        price: price || 0,
        hasVariants: Boolean(body.hasVariants),
      },
      include: { variants: true },
    })
    return NextResponse.json(product, { status: 201 })
  } catch { return unauthorized() }
}
