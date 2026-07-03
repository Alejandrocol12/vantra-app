import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('u')
  if (!userId) return NextResponse.json({ error: 'Tienda no especificada.' }, { status: 400 })

  const [user, products] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, whatsappNumber: true },
    }),
    prisma.product.findMany({
      where: { userId },
      include: { variants: { orderBy: { label: 'asc' } } },
      orderBy: { category: 'asc' },
    }),
  ])

  if (!user) return NextResponse.json({ error: 'Tienda no encontrada.' }, { status: 404 })

  return NextResponse.json({ storeName: user.name, whatsappNumber: user.whatsappNumber, products })
}
