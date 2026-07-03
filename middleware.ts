import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC = ['/login', '/catalogo', '/api/auth', '/api/public']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = request.cookies.get('vantra_session')?.value
  if (!token) return NextResponse.redirect(new URL('/login', request.url))

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'fallback-secret')
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('vantra_session')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|icon|apple-icon|manifest|uploads).*)'],
}
