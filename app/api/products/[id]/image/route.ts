import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put, del } from '@vercel/blob'
import { getUserId, unauthorized } from '@/lib/auth'

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

  if (file.size > 3 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 3 MB.' }, { status: 400 })
  }

  // delete old blob if it was previously uploaded
  const existing = await prisma.product.findUnique({ where: { id: params.id }, select: { image: true } })
  if (existing?.image?.startsWith('https://')) {
    await del(existing.image).catch(() => {})
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const blob = await put(`products/${params.id}-${Date.now()}.${ext}`, file, { access: 'public' })

  await prisma.product.update({ where: { id: params.id }, data: { image: blob.url } })

  return NextResponse.json({ image: blob.url })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try { await getUserId() } catch { return unauthorized() }

  const product = await prisma.product.findUnique({ where: { id: params.id }, select: { image: true } })

  if (product?.image?.startsWith('https://')) {
    await del(product.image).catch(() => {})
  }

  await prisma.product.update({ where: { id: params.id }, data: { image: null } })

  return NextResponse.json({ ok: true })
}
