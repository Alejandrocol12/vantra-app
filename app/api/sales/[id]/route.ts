import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const sale = await prisma.sale.findUnique({ where: { id: params.id } })
  if (!sale) return NextResponse.json({ error: 'Venta no encontrada.' }, { status: 404 })
  if (sale.status === 'anulada') return NextResponse.json({ error: 'No se puede editar una venta anulada.' }, { status: 400 })

  const updated = await prisma.sale.update({
    where: { id: params.id },
    data: {
      payment: body.payment ? String(body.payment) : undefined,
      note: body.note !== undefined ? (body.note?.trim() || null) : undefined,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const sale = await prisma.sale.findUnique({ where: { id: params.id } })
  if (!sale) return NextResponse.json({ error: 'Venta no encontrada.' }, { status: 404 })

  // Already cancelled → hard delete the record
  if (sale.status === 'anulada') {
    await prisma.sale.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true, deleted: true })
  }

  const reference = `REV-${String(Date.now()).slice(-5)}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = [prisma.sale.update({ where: { id: params.id }, data: { status: 'anulada' } })]

  if (sale.variantId) {
    const variant = await prisma.variant.findUnique({ where: { id: sale.variantId } })
    if (variant) {
      const stockBefore = variant.stock
      ops.push(
        prisma.variant.update({ where: { id: sale.variantId }, data: { stock: { increment: sale.quantity } } }),
        prisma.movement.create({
          data: {
            reference,
            productId: sale.productId ?? sale.productName,
            productName: sale.productName,
            variantId: sale.variantId,
            variantLabel: sale.variantLabel,
            type: 'Reversa',
            quantity: sale.quantity,
            stockBefore,
            stockAfter: stockBefore + sale.quantity,
            note: 'Venta anulada',
          },
        })
      )
    }
  } else if (sale.productId) {
    const product = await prisma.product.findUnique({ where: { id: sale.productId } })
    if (product) {
      const stockBefore = product.stock
      ops.push(
        prisma.product.update({ where: { id: sale.productId }, data: { stock: { increment: sale.quantity } } }),
        prisma.movement.create({
          data: {
            reference,
            productId: sale.productId,
            productName: sale.productName,
            type: 'Reversa',
            quantity: sale.quantity,
            stockBefore,
            stockAfter: stockBefore + sale.quantity,
            note: 'Venta anulada',
          },
        })
      )
    }
  }

  await prisma.$transaction(ops)
  return NextResponse.json({ ok: true })
}
