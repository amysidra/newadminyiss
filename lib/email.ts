import nodemailer from 'nodemailer'

// ── Public types ───────────────────────────────────────────────

export interface InvoiceLineItem {
  studentName: string
  description: string
  amount: number
  dueDate: string // ISO 8601
}

export interface SendInvoiceEmailParams {
  toEmail: string
  guardianName: string
  items: InvoiceLineItem[]
}

export interface EmailResult {
  success: boolean
  email: string
  error?: string
}

// ── SMTP transporter ───────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? '587'),
    secure: false, // STARTTLS pada port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// ── Formatting helpers ─────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

// ── Email content builders ─────────────────────────────────────

function buildHtml(params: SendInvoiceEmailParams): string {
  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/portal/invoices`
  const totalAmount = params.items.reduce((sum, item) => sum + item.amount, 0)

  const rows = params.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">
        ${item.studentName}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">
        ${item.description}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;white-space:nowrap;">
        ${formatTanggal(item.dueDate)}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1a7a4a;font-weight:700;text-align:right;white-space:nowrap;">
        ${formatRupiah(item.amount)}
      </td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Tagihan SPP YISS</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1a7a4a;padding:20px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:72px;vertical-align:middle;">
                    <img
                      src="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/Logo.png"
                      alt="YISS"
                      width="56"
                      style="display:block;height:auto;border-radius:8px;"
                    />
                  </td>
                  <td style="vertical-align:middle;padding-left:16px;">
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                      Invoice SPP
                    </h1>
                    <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">
                      Yayasan Islam Sahabat Sunnah Semarang
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0;font-size:15px;color:#334155;">
                Assalamu'alaikum,
                <strong style="color:#1e293b;">${params.guardianName}</strong>
              </p>
              <p style="margin:12px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
                Tagihan SPP berikut telah diterbitkan untuk putra/putri Anda.
                Mohon melakukan pembayaran sebelum tanggal jatuh tempo demi kelancaran pembelajaran putra/putri Anda. Terima kasih atas perhatian dan kerjasamanya.
              </p>
            </td>
          </tr>

          <!-- Invoice Table -->
          <tr>
            <td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <thead>
                  <tr style="background-color:#f8fafc;">
                    <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;border-bottom:1px solid #e2e8f0;">Murid</th>
                    <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;border-bottom:1px solid #e2e8f0;">Keterangan</th>
                    <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;border-bottom:1px solid #e2e8f0;">Jatuh Tempo</th>
                    <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;border-bottom:1px solid #e2e8f0;">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
                <tfoot>
                  <tr style="background-color:#f0fdf4;">
                    <td colspan="3"
                      style="padding:12px;font-size:13px;font-weight:700;color:#1e293b;border-top:2px solid #bbf7d0;">
                      Total
                    </td>
                    <td style="padding:12px;font-size:15px;font-weight:800;color:#1a7a4a;text-align:right;white-space:nowrap;border-top:2px solid #bbf7d0;">
                      ${formatRupiah(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${portalUrl}"
                style="display:inline-block;padding:14px 36px;background-color:#1a7a4a;color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;">
                Lihat &amp; Bayar Tagihan
              </a>
              <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">
                Atau kunjungi: <a href="${portalUrl}" style="color:#1a7a4a;">${portalUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;">
                Email ini dikirim secara otomatis oleh sistem administrasi YISS.<br>
                Jika ada pertanyaan, silakan hubungi kantor administrasi sekolah.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildText(params: SendInvoiceEmailParams): string {
  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/portal/invoices`
  const total = params.items.reduce((s, i) => s + i.amount, 0)

  const lines = params.items.map(
    (item) =>
      `- ${item.studentName}: ${item.description} | Jatuh tempo: ${formatTanggal(item.dueDate)} | ${formatRupiah(item.amount)}`
  )

  return [
    `Assalamu'alaikum, ${params.guardianName}`,
    '',
    'Tagihan SPP berikut telah diterbitkan untuk putra/putri Anda:',
    ...lines,
    '',
    `Total: ${formatRupiah(total)}`,
    '',
    `Lihat dan bayar tagihan di: ${portalUrl}`,
    '',
    'Email ini dikirim otomatis oleh sistem administrasi YISS.',
    'Jika ada pertanyaan, hubungi kantor administrasi sekolah.',
  ].join('\n')
}

// ── Public send function ───────────────────────────────────────

export async function sendInvoiceEmail(
  params: SendInvoiceEmailParams
): Promise<EmailResult> {
  const { toEmail } = params

  const smtpConfigured =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS

  if (!smtpConfigured) {
    console.warn('[email] SMTP tidak dikonfigurasi — skip email ke', toEmail)
    return { success: false, email: toEmail, error: 'SMTP not configured' }
  }

  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: toEmail,
      subject: `Tagihan SPP YISS — ${params.guardianName}`,
      html: buildHtml(params),
      text: buildText(params),
    })
    console.log('[email] Terkirim ke', toEmail)
    return { success: true, email: toEmail }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[email] Gagal kirim ke', toEmail, ':', message)
    return { success: false, email: toEmail, error: message }
  }
}
