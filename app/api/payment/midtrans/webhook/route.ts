import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!

// Map status Midtrans → status invoice internal
const STATUS_MAP: Record<string, string> = {
  capture: 'PAID',
  settlement: 'PAID',
  pending: 'PENDING',
  deny: 'FAILED',
  cancel: 'CANCELLED',
  expire: 'EXPIRED',
  failure: 'FAILED',
}

function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const payload = orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY
  const expected = createHash('sha512').update(payload).digest('hex')
  return expected === signatureKey
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body

    // 1. Verifikasi signature — tolak request palsu
    if (!verifySignature(order_id, status_code, gross_amount, signature_key)) {
      console.warn('Midtrans webhook: signature tidak valid', { order_id })
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 })
    }

    // 2. Tentukan status final
    // capture dengan fraud_status=challenge = perlu review manual
    let finalStatus = STATUS_MAP[transaction_status] ?? 'PENDING'
    if (transaction_status === 'capture' && fraud_status === 'challenge') {
      finalStatus = 'PENDING'
    }

    // 3. Cari invoice berdasarkan external_id yang disimpan saat token dibuat
    const { data: invoice, error: findError } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('external_id', order_id)
      .single()

    if (findError || !invoice) {
      console.error('Webhook: invoice tidak ditemukan untuk order_id:', order_id)
      // Kembalikan 200 agar Midtrans tidak retry terus-menerus
      return NextResponse.json({ message: 'Invoice not found' }, { status: 200 })
    }

    // 4. Jangan overwrite status yang sudah final
    if (['PAID', 'CANCELLED', 'EXPIRED'].includes(invoice.status)) {
      return NextResponse.json({ message: 'Status already final' }, { status: 200 })
    }

    // 5. Update invoice
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: finalStatus,
        payment_method: payment_type ?? null,
        external_id: order_id,
      })
      .eq('id', invoice.id)

    if (updateError) {
      console.error('Webhook: gagal update invoice:', updateError)
      return NextResponse.json({ message: 'DB update failed' }, { status: 500 })
    }

    console.log(`Webhook OK: invoice ${invoice.id} → ${finalStatus}`)
    return NextResponse.json({ message: 'OK' }, { status: 200 })
  } catch (err: any) {
    console.error('Webhook error:', err)
    // Tetap 200 agar Midtrans tidak retry untuk error parsing
    return NextResponse.json({ message: err.message }, { status: 200 })
  }
}
