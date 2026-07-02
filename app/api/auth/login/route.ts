import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (
    email?.toLowerCase().trim() !== process.env.ADMIN_EMAIL?.toLowerCase() ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 })
  }

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'fallback-secret')
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)

  const res = NextResponse.json({ ok: true })
  res.cookies.set('vantra_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
