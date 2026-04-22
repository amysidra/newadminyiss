import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROLE_HOME: Record<string, string> = {
  admin:     '/dashboard',
  walimurid: '/portal',
  guru:      '/teacher',
  tendik:    '/tendik',
}

const ROUTE_ROLE: Array<{ prefix: string; role: string }> = [
  { prefix: '/dashboard', role: 'admin' },
  { prefix: '/portal',    role: 'walimurid' },
  { prefix: '/teacher',   role: 'guru' },
  { prefix: '/tendik',    role: 'tendik' },
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLoginPage    = pathname === '/'
  const isUnauthorized = pathname.startsWith('/unauthorized')
  const matchedRoute   = ROUTE_ROLE.find(r => pathname.startsWith(r.prefix))
  const isPrivateRoute = !!matchedRoute

  // Belum login, akses rute privat → login
  if (!user && isPrivateRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Sudah login — ambil role dari DB untuk semua keputusan routing
  if (user && (isLoginPage || isPrivateRoute)) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role as string | undefined

    // Login page → arahkan ke halaman sesuai role
    if (isLoginPage) {
      const dest = role ? (ROLE_HOME[role] ?? '/unauthorized') : '/unauthorized'
      return NextResponse.redirect(new URL(dest, request.url))
    }

    // Rute privat → pastikan role cocok
    if (isPrivateRoute && matchedRoute!.role !== role) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // /unauthorized hanya untuk user yang sudah login
  if (!user && isUnauthorized) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|LogoYiss.png|.*\\.png|.*\\.svg|api/).*)',
  ],
}
