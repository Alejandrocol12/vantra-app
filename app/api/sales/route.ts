import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includeAnuladas = searchParams.get('includeAnuladas') === '1'

  const sales = await prisma.sale.findMany({
    where: includeAnuladas ? undefined : undefined, // always return all, UI filters
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(sales)
}
