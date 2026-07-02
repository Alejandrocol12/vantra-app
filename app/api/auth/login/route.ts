import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  if (!email || !password) return NextResponse.json({ error: 'Completa todos los campos.' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user) return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 })

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 })

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'fallback-secret')
  const token = await new SignJWT({ userId: user.id, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)

  const res = NextResponse.json({ ok: true, name: user.name })
  res.cookies.set('vantra_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
