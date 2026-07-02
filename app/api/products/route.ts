import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const products = await prisma.product.findMany({
    include: { variants: { orderBy: { label: 'asc' } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.name || !body.category) {
    return NextResponse.json({ error: 'Nombre y categoría son obligatorios.' }, { status: 400 })
  }

  const price = Number(body.price)
  if (!price || price <= 0) {
    return NextResponse.json({ error: 'El precio debe ser mayor a 0.' }, { status: 400 })
  }

  const trimmedName = String(body.name).trim()
  const existing = await prisma.product.findFirst({ where: { name: { equals: trimmedName } } })
  if (existing) {
    return NextResponse.json({ error: `Ya existe un producto con el nombre "${trimmedName}".` }, { status: 409 })
  }

  const product = await prisma.product.create({
    data: {
      name: trimmedName,
      category: String(body.category),
      flavor: body.flavor ? String(body.flavor).trim() : null,
      stock: Number(body.stock) || 0,
      minStock: Number(body.minStock) || 0,
      cost: Number(body.cost) || 0,
      price,
      hasVariants: false,
    },
    include: { variants: true },
  })

  return NextResponse.json(product, { status: 201 })
}
