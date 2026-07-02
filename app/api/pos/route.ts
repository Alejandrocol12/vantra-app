import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function genRef() {
  return `VTA-${String(Date.now()).slice(-5)}`
}

export async function POST(request: Request) {
  const { items, payment, note, clienteId } = await request.json() as {
    items: { productId: string; variantId?: string; quantity: number }[]
    payment: string
    note?: string
    clienteId?: string
  }

  if (!items?.length) return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 })

  const reference = genRef()
  const productIds = Array.from(new Set(items.map(i => i.productId)))
  const variantIds = items.filter(i => i.variantId).map(i => i.variantId!)

  const [products, variants] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } } }),
    variantIds.length ? prisma.variant.findMany({ where: { id: { in: variantIds } } }) : Promise.resolve([]),
  ])

  // Validate stock for all items and compute total
  let ventaTotal = 0
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)
    if (!product) return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 })

    if (item.variantId) {
      const variant = variants.find(v => v.id === item.variantId)
      if (!variant) return NextResponse.json({ error: 'Variante no encontrada.' }, { status: 404 })
      if (variant.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuficiente de "${product.name} – ${variant.label}" (disponible: ${variant.stock}).` }, { status: 400 })
      }
      ventaTotal += variant.price * item.quantity
    } else {
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Stock insuficiente de "${product.name}" (disponible: ${product.stock}).` }, { status: 400 })
      }
      ventaTotal += product.price * item.quantity
    }
  }

  if (payment === 'Fiado') {
    if (!clienteId) return NextResponse.json({ error: 'Selecciona un cliente para la venta a fiado.' }, { status: 400 })
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        sales: { where: { payment: 'Fiado', status: 'activa' }, select: { total: true } },
        abonos: { select: { amount: true } },
      },
    })
    if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 })

    if (cliente.limiteCredito != null) {
      const totalFiado = cliente.sales.reduce((s, x) => s + x.total, 0)
      const totalAbonado = cliente.abonos.reduce((s, a) => s + a.amount, 0)
      const deudaActual = totalFiado - totalAbonado
      if (deudaActual + ventaTotal > cliente.limiteCredito) {
        const disponible = Math.max(0, cliente.limiteCredito - deudaActual)
        return NextResponse.json({
          error: `Límite de crédito excedido. Disponible: $${disponible.toLocaleString()} — esta venta es $${ventaTotal.toLocaleString()}.`,
        }, { status: 400 })
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = []

  for (const item of items) {
    const product = products.find(p => p.id === item.productId)!
    const variant = item.variantId ? variants.find(v => v.id === item.variantId) : null

    const cost  = variant ? variant.cost  : product.cost
    const price = variant ? variant.price : product.price
    const total  = price * item.quantity
    const profit = (price - cost) * item.quantity

    if (variant) {
      const stockAfter = variant.stock - item.quantity
      ops.push(
        prisma.sale.create({
          data: {
            productId: product.id, productName: product.name,
            variantId: variant.id, variantLabel: variant.label,
            quantity: item.quantity, payment,
            clienteId: payment === 'Fiado' ? clienteId : null,
            note: note ?? null, total, profit,
          },
        }),
        prisma.variant.update({ where: { id: variant.id }, data: { stock: { decrement: item.quantity } } }),
        prisma.movement.create({
          data: {
            reference, productId: product.id, productName: product.name,
            variantId: variant.id, variantLabel: variant.label,
            type: 'Venta', quantity: -item.quantity,
            stockBefore: variant.stock, stockAfter, note: note ?? null,
          },
        })
      )
      variant.stock = stockAfter
    } else {
      const stockAfter = product.stock - item.quantity
      ops.push(
        prisma.sale.create({
          data: {
            productId: product.id, productName: product.name,
            quantity: item.quantity, payment,
            clienteId: payment === 'Fiado' ? clienteId : null,
            note: note ?? null, total, profit,
          },
        }),
        prisma.product.update({ where: { id: product.id }, data: { stock: { decrement: item.quantity } } }),
        prisma.movement.create({
          data: {
            reference, productId: product.id, productName: product.name,
            type: 'Venta', quantity: -item.quantity,
            stockBefore: product.stock, stockAfter, note: note ?? null,
          },
        })
      )
      product.stock = stockAfter
    }
  }

  await prisma.$transaction(ops)
  return NextResponse.json({ ok: true, reference }, { status: 201 })
}
