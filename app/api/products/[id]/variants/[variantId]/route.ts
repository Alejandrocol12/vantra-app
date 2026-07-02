import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string; variantId: string } }) {
  const { label, stock, minStock, cost, price } = await request.json()
  if (!label?.trim()) return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 })

  const variant = await prisma.variant.update({
    where: { id: params.variantId },
    data: {
      label: label.trim(),
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      cost: Number(cost) || 0,
      price: Number(price) || 0,
    },
  })
  return NextResponse.json(variant)
}

export async function DELETE(_: Request, { params }: { params: { id: string; variantId: string } }) {
  const sales = await prisma.sale.count({ where: { variantId: params.variantId } })
  if (sales > 0) {
    return NextResponse.json({ error: 'No se puede eliminar una variante con ventas registradas.' }, { status: 409 })
  }

  await prisma.variant.delete({ where: { id: params.variantId } })

  // If no more variants, disable hasVariants on parent
  const remaining = await prisma.variant.count({ where: { productId: params.id } })
  if (remaining === 0) {
    await prisma.product.update({ where: { id: params.id }, data: { hasVariants: false } })
  }

  return NextResponse.json({ ok: true })
}
