import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const count = await prisma.user.count()
  return NextResponse.json({ hasUsers: count > 0 })
}

export async function POST(request: Request) {
  const { name, email, password } = await request.json()
  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Completa todos los campos.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (existing) return NextResponse.json({ error: 'Este correo ya está registrado.' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase().trim(), passwordHash },
  })
  return NextResponse.json({ ok: true, id: user.id }, { status: 201 })
}
