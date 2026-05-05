import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeJob, supabaseAdmin } from '@/lib/cron-executor'

export async function POST(request: NextRequest) {
  // Verify admin session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const { jobId } = await request.json()

  if (!jobId) {
    return NextResponse.json({ message: 'jobId wajib diisi' }, { status: 400 })
  }

  const { data: job, error } = await supabaseAdmin
    .from('cron_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error || !job) {
    return NextResponse.json({ message: 'Job tidak ditemukan' }, { status: 404 })
  }

  const result = await executeJob(job)

  // Return updated job record for UI refresh
  const { data: updatedJob } = await supabaseAdmin
    .from('cron_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  return NextResponse.json({ ...result, job: updatedJob })
}
