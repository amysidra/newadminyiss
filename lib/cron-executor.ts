import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/** Returns current time as a Date object offset to WIB (UTC+7) */
export function getWIBDate(): Date {
  return new Date(Date.now() + 7 * 60 * 60 * 1000)
}

function buildDescription(template: string, date: Date): string {
  const month = INDONESIAN_MONTHS[date.getUTCMonth()]
  const year = date.getUTCFullYear().toString()
  return template
    .replace(/{MONTH}/gi, month)
    .replace(/{YEAR}/gi, year)
}

export interface CronJobRow {
  id: string
  name: string
  job_type: string
  invoice_description_template: string
  due_date_offset_days: number
}

export interface JobResult {
  jobId: string
  count: number
  status: 'success' | 'error'
  message: string
}

export async function executeJob(job: CronJobRow): Promise<JobResult> {
  const now = getWIBDate()

  try {
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, spp_category:spp_categories!spp_category_id(amount)')
      .eq('status', 'Aktif')
      .not('spp_category_id', 'is', null)

    if (studentsError) throw studentsError

    if (!students || students.length === 0) {
      await supabaseAdmin.from('cron_jobs').update({
        last_run_at: new Date().toISOString(),
        last_run_status: 'success',
        last_run_count: 0,
        last_run_message: 'Tidak ada murid aktif dengan kategori SPP',
      }).eq('id', job.id)

      return {
        jobId: job.id,
        count: 0,
        status: 'success',
        message: 'Tidak ada murid aktif dengan kategori SPP',
      }
    }

    const description = buildDescription(job.invoice_description_template, now)
    const dueDate = new Date(
      now.getTime() + job.due_date_offset_days * 24 * 60 * 60 * 1000
    )

    const invoices = (students as any[]).map((s) => ({
      student_id: s.id,
      description,
      amount: s.spp_category.amount,
      status: 'UNPAID',
      due_date: dueDate.toISOString(),
    }))

    const { error: insertError } = await supabaseAdmin
      .from('invoices')
      .insert(invoices)

    if (insertError) throw insertError

    const message = `${invoices.length} invoice berhasil dibuat`

    await supabaseAdmin.from('cron_jobs').update({
      last_run_at: new Date().toISOString(),
      last_run_status: 'success',
      last_run_count: invoices.length,
      last_run_message: message,
    }).eq('id', job.id)

    return { jobId: job.id, count: invoices.length, status: 'success', message }
  } catch (err: any) {
    const message = err.message ?? 'Unknown error'

    await supabaseAdmin.from('cron_jobs').update({
      last_run_at: new Date().toISOString(),
      last_run_status: 'error',
      last_run_count: 0,
      last_run_message: message,
    }).eq('id', job.id)

    return { jobId: job.id, count: 0, status: 'error', message }
  }
}
