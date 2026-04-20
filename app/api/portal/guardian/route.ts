import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ guardianId: null }, { status: 401 })
  }

  // Coba cari guardian langsung by user_id = auth.uid()
  const { data: direct } = await admin
    .from('guardians')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (direct) {
    return NextResponse.json({ guardianId: direct.id })
  }

  // Tidak ditemukan — guardian masih menunjuk ke UUID lama
  // Cari semua public.users dengan email ini (termasuk legacy entry)
  const { data: usersByEmail } = await admin
    .from('users')
    .select('id')
    .eq('email', user.email!)

  for (const u of usersByEmail ?? []) {
    if (u.id === user.id) continue // sudah dicek, skip

    const { data: legacyGuardian } = await admin
      .from('guardians')
      .select('id')
      .eq('user_id', u.id)
      .maybeSingle()

    if (legacyGuardian) {
      // Self-heal: update guardian.user_id ke auth.uid() yang benar
      await admin
        .from('guardians')
        .update({ user_id: user.id })
        .eq('id', legacyGuardian.id)

      return NextResponse.json({ guardianId: legacyGuardian.id })
    }
  }

  return NextResponse.json({ guardianId: null })
}
