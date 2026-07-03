import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function getUserId(): Promise<string> {
  const token = cookies().get('vantra_session')?.value
  if (!token) throw new Error('Unauthorized')
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'fallback-secret')
  const { payload } = await jwtVerify(token, secret)
  if (!payload.userId) throw new Error('Unauthorized')
  return payload.userId as string
}

export function unauthorized() {
  return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
}
