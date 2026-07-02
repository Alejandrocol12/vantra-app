import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'products')

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const filename = `${params.id}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(uploadDir, filename), buffer)

  const image = `/uploads/products/${filename}`
  await prisma.product.update({ where: { id: params.id }, data: { image } })

  return NextResponse.json({ image })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id }, select: { image: true } })

  if (product?.image) {
    const filePath = join(process.cwd(), 'public', product.image)
    if (existsSync(filePath)) {
      await unlink(filePath).catch(() => {})
    }
    await prisma.product.update({ where: { id: params.id }, data: { image: null } })
  }

  return NextResponse.json({ ok: true })
}
