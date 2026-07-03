import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized } from '@/lib/auth'

const MAX_BYTES = 500 * 1024 // 500 KB

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try { await getUserId() } catch { return unauthorized() }

  const formData = await request.formData()
  const file = formData.get('image') as File | null

  if (!file || !file.size) {
    return NextResponse.json({ error: 'No se proporcionó imagen.' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no permitido. Usa JPG, PNG o WebP.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'La imagen no puede superar 500 KB.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const mime = file.type === 'image/jpg' ? 'image/jpeg' : file.type
  const image = `data:${mime};base64,${buffer.toString('base64')}`

  await prisma.product.update({ where: { id: params.id }, data: { image } })

  return NextResponse.json({ image })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try { await getUserId() } catch { return unauthorized() }
  await prisma.product.update({ where: { id: params.id }, data: { image: null } })
  return NextResponse.json({ ok: true })
}
