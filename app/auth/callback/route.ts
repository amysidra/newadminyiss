import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  const supabase = await createClient()
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
  const authProfile  = profiles.find(p => p.id === user.id)           // dibuat trigger
  const legacyProfile = profiles.find(p => p.id !== user.id)          // dibuat admin untuk guardian

  let finalRole = authProfile?.role ?? 'walimurid'

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

  const destination = finalRole === 'walimurid' ? '/portal' : '/dashboard'
  return NextResponse.redirect(`${origin}${destination}`)
}
