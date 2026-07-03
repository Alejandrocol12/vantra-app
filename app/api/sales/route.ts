import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userId = await getUserId()
    const sales = await prisma.sale.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(sales)
  } catch { return unauthorized() }
}
