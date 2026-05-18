import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/leghe', '/squadra', '/mercato', '/formazione', '/classifica']
const AUTH_PAGES = ['/login', '/register']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const token = [...request.cookies.getAll()].find(c => c.name.includes('auth-token'))
  const isLoggedIn = !!token

  if (!isLoggedIn && PROTECTED.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL(`/login?redirect=${path}`, request.url))
  }
  if (isLoggedIn && AUTH_PAGES.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',],
}
