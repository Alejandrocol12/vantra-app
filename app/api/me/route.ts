import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userId = await getUserId()
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, whatsappNumber: true },
    })
    return NextResponse.json(user)
  } catch { return unauthorized() }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserId()
    const { whatsappNumber } = await request.json()
    const user = await prisma.user.update({
      where: { id: userId },
      data: { whatsappNumber: whatsappNumber?.trim() || null },
      select: { id: true, name: true, email: true, whatsappNumber: true },
    })
    return NextResponse.json(user)
  } catch { return unauthorized() }
}
