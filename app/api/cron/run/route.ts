import { NextRequest, NextResponse } from 'next/server'
import { executeJob, getWIBDate, supabaseAdmin } from '@/lib/cron-executor'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const now = getWIBDate()
  const today = now.getUTCDate()

  const { data: jobs, error } = await supabaseAdmin
    .from('cron_jobs')
    .select('*')
    .eq('is_active', true)
    .eq('schedule_day', today)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ success: true, processed: 0, results: [] })
  }

  const results = await Promise.all(jobs.map(executeJob))

  return NextResponse.json({ success: true, processed: results.length, results })
}
