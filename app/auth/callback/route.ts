import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  // Buffer cookies yang di-set saat exchangeCodeForSession agar bisa ditempel ke redirect response.
  // Ini wajib di Netlify karena route handler (Lambda) dan middleware (Edge) adalah proses terpisah —
  // cookies dari Next.js cookie store tidak otomatis masuk ke NextResponse.redirect().
  const cookieBuffer: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(c => cookieBuffer.push(c))
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  // Gunakan service role agar bisa merge profile tanpa RLS blocking
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Cari semua profil dengan email ini
  const { data: allProfiles } = await admin
    .from('users')
    .select('id, role, first_name, last_name, phone')
    .eq('email', user.email!)

  const profiles = allProfiles ?? []
  const authProfile   = profiles.find(p => p.id === user.id)    // dibuat trigger (merge)
  const legacyProfile = profiles.find(p => p.id !== user.id)    // dibuat admin sebelum user login

  // Tidak ada profil sama sekali → user tidak terdaftar, tolak akses
  if (profiles.length === 0) {
    const res = NextResponse.redirect(`${origin}/unauthorized`)
    cookieBuffer.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  }

  let finalRole = authProfile?.role ?? legacyProfile?.role

  if (!finalRole) {
    const res = NextResponse.redirect(`${origin}/unauthorized`)
    cookieBuffer.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  }

  if (legacyProfile) {
    // Merge: akun lama (random uuid) dengan akun Google (auth uuid)
    // 1. Pindahkan referensi guardians ke auth uuid
    await admin
      .from('guardians')
      .update({ user_id: user.id })
      .eq('user_id', legacyProfile.id)

    if (authProfile) {
      // Trigger sudah buat entry dengan role='admin' — koreksi role-nya
      await admin
        .from('users')
        .update({
          role:       legacyProfile.role,
          first_name: legacyProfile.first_name ?? authProfile.first_name,
          last_name:  legacyProfile.last_name  ?? authProfile.last_name,
        })
        .eq('id', user.id)
      finalRole = legacyProfile.role
    } else {
      // Trigger belum membuat entry — buat langsung dengan data yang benar
      await admin.from('users').insert({
        id:         user.id,
        email:      user.email,
        role:       legacyProfile.role,
        first_name: legacyProfile.first_name,
        last_name:  legacyProfile.last_name,
        phone:      legacyProfile.phone,
      })
      finalRole = legacyProfile.role
    }

    // Hapus entry lama
    await admin.from('users').delete().eq('id', legacyProfile.id)
  }

  const ROLE_DESTINATIONS: Record<string, string> = {
    admin:     '/dashboard',
    walimurid: '/portal',
    guru:      '/teacher',
    tendik:    '/tendik',
  }
  const destination = ROLE_DESTINATIONS[finalRole] ?? '/unauthorized'

  const response = NextResponse.redirect(`${origin}${destination}`)
  // Tempel session cookies ke redirect response agar browser langsung terautentikasi
  cookieBuffer.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  return response
}
