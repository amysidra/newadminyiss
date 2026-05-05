import { createClient } from '@supabase/supabase-js'
import { sendInvoiceEmail, type InvoiceLineItem, type EmailResult } from '@/lib/email'

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

// ── Types for nested Supabase query ───────────────────────────

interface SppCategory {
  amount: number
}

interface GuardianUser {
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface StudentGuardian {
  email: string | null
  user: GuardianUser | null
}

interface StudentRow {
  id: string
  fullname: string
  guardian_id: string | null
  spp_category: SppCategory
  guardian: StudentGuardian | null
}

function resolveGuardianEmail(guardian: StudentGuardian | null): string | null {
  if (!guardian) return null
  return guardian.user?.email ?? guardian.email ?? null
}

function resolveGuardianName(guardian: StudentGuardian | null): string {
  const user = guardian?.user
  const first = user?.first_name ?? ''
  const last = user?.last_name ?? ''
  const fullName = `${first} ${last}`.trim()
  return fullName || 'Wali Murid'
}

// ──────────────────────────────────────────────────────────────

export async function executeJob(job: CronJobRow): Promise<JobResult> {
  const now = getWIBDate()

  try {
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        fullname,
        guardian_id,
        spp_category:spp_categories!spp_category_id(amount),
        guardian:guardians!guardian_id(
          email,
          user:users!user_id(
            first_name,
            last_name,
            email
          )
        )
      `)
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

    const typedStudents = students as unknown as StudentRow[]

    const invoices = typedStudents.map((s) => ({
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

    // ── Kirim email notifikasi ke wali murid ───────────────────

    const guardianMap = new Map<string, { guardianName: string; items: InvoiceLineItem[] }>()

    for (const student of typedStudents) {
      const email = resolveGuardianEmail(student.guardian)
      if (!email) continue

      const name = resolveGuardianName(student.guardian)
      const lineItem: InvoiceLineItem = {
        studentName: student.fullname,
        description,
        amount: student.spp_category.amount,
        dueDate: dueDate.toISOString(),
      }

      const existing = guardianMap.get(email)
      if (existing) {
        existing.items.push(lineItem)
      } else {
        guardianMap.set(email, { guardianName: name, items: [lineItem] })
      }
    }

    const emailResults = await Promise.allSettled(
      [...guardianMap.entries()].map(([email, { guardianName, items }]) =>
        sendInvoiceEmail({ toEmail: email, guardianName, items })
      )
    )

    let emailsSent = 0
    let emailsFailed = 0

    for (const result of emailResults) {
      if (result.status === 'fulfilled' && result.value.success) {
        emailsSent++
      } else {
        emailsFailed++
        const reason =
          result.status === 'rejected' ? result.reason : (result.value as EmailResult).error
        console.error('[executeJob] Gagal kirim email:', reason)
      }
    }

    const noEmailCount = typedStudents.filter(
      (s) => resolveGuardianEmail(s.guardian) === null
    ).length

    // ──────────────────────────────────────────────────────────

    const messageParts = [`${invoices.length} invoice berhasil dibuat`]
    if (emailsSent > 0) messageParts.push(`${emailsSent} email terkirim`)
    if (emailsFailed > 0) messageParts.push(`${emailsFailed} email gagal`)
    if (noEmailCount > 0) messageParts.push(`${noEmailCount} murid tanpa email wali`)
    const message = messageParts.join(', ')

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
