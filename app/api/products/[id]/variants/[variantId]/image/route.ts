import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 2 * 1024 * 1024

export async function POST(request: Request, { params }: { params: { id: string; variantId: string } }) {
  try { await getUserId() } catch { return unauthorized() }

  const formData = await request.formData()
  const file = formData.get('image') as File | null

  if (!file || !file.size) return NextResponse.json({ error: 'No se proporcionó imagen.' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG o WebP.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'La imagen no puede superar 2 MB.' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const mime = file.type === 'image/jpg' ? 'image/jpeg' : file.type
  const image = `data:${mime};base64,${buffer.toString('base64')}`

  await prisma.variant.update({ where: { id: params.variantId }, data: { image } })

  return NextResponse.json({ image })
}

export async function DELETE(_: Request, { params }: { params: { variantId: string } }) {
  try { await getUserId() } catch { return unauthorized() }
  await prisma.variant.update({ where: { id: params.variantId }, data: { image: null } })
  return NextResponse.json({ ok: true })
}
