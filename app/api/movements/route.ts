import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userId = await getUserId()
    const movements = await prisma.movement.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 200,
    })
    return NextResponse.json(movements)
  } catch { return unauthorized() }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    const body = await request.json()

    const product = await prisma.product.findFirst({ where: { id: body.productId, userId } })
    if (!product) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 })

    const qty = Number(body.quantity)
    if (!qty) return NextResponse.json({ error: 'Cantidad inválida.' }, { status: 400 })

    const prefix = body.type === 'Compra' ? 'COM' : 'AJU'
    const reference = `${prefix}-${String(Date.now()).slice(-5)}`

    if (product.hasVariants) {
      if (!body.variantId) return NextResponse.json({ error: 'Este producto tiene variantes. Selecciona una variante.' }, { status: 400 })
      const variant = await prisma.variant.findUnique({ where: { id: body.variantId } })
      if (!variant || variant.productId !== product.id) return NextResponse.json({ error: 'Variante no encontrada.' }, { status: 404 })

      const stockBefore = variant.stock
      const stockAfter = stockBefore + qty
      if (stockAfter < 0) return NextResponse.json({ error: 'Stock resultante no puede ser negativo.' }, { status: 400 })

      const [movement] = await prisma.$transaction([
        prisma.movement.create({ data: { userId, reference, productId: product.id, productName: product.name, variantId: variant.id, variantLabel: variant.label, type: body.type ?? 'Ajuste', quantity: qty, stockBefore, stockAfter, note: body.note ?? null } }),
        prisma.variant.update({ where: { id: variant.id }, data: { stock: stockAfter } }),
      ])
      return NextResponse.json(movement, { status: 201 })
    }

    const stockBefore = product.stock
    const stockAfter = stockBefore + qty
    if (stockAfter < 0) return NextResponse.json({ error: 'Stock resultante no puede ser negativo.' }, { status: 400 })

    const [movement] = await prisma.$transaction([
      prisma.movement.create({ data: { userId, reference, productId: product.id, productName: product.name, type: body.type ?? 'Ajuste', quantity: qty, stockBefore, stockAfter, note: body.note ?? null } }),
      prisma.product.update({ where: { id: product.id }, data: { stock: stockAfter } }),
    ])
    return NextResponse.json(movement, { status: 201 })
  } catch { return unauthorized() }
}
