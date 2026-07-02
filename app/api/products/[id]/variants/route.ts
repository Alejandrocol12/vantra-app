import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const variants = await prisma.variant.findMany({
    where: { productId: params.id },
    orderBy: { label: 'asc' },
  })
  return NextResponse.json(variants)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { label, stock, minStock, cost, price } = await request.json()
  if (!label?.trim()) return NextResponse.json({ error: 'El nombre de la variante es requerido.' }, { status: 400 })

  const [variant] = await prisma.$transaction([
    prisma.variant.create({
      data: {
        productId: params.id,
        label: label.trim(),
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        cost: Number(cost) || 0,
        price: Number(price) || 0,
      },
    }),
    prisma.product.update({
      where: { id: params.id },
      data: { hasVariants: true },
    }),
  ])

  return NextResponse.json(variant, { status: 201 })
}
