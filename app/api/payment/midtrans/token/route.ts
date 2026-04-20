import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client — bypass RLS untuk operasi server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!
const MIDTRANS_MODE = process.env.NEXT_PUBLIC_MIDTRANS_MODE ?? 'sandbox'
const MIDTRANS_BASE_URL =
  MIDTRANS_MODE === 'production'
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json()

    if (!invoiceId) {
      return NextResponse.json({ message: 'invoiceId wajib diisi' }, { status: 400 })
    }

    // 1. Ambil data invoice beserta data siswa
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, students ( fullname, guardian_id, guardians ( phone, email, users!user_id ( first_name, last_name, email, phone ) ) )')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ message: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ message: 'Invoice sudah lunas' }, { status: 400 })
    }

    // 2. Gunakan snap_token yang sudah ada jika masih valid
    if (invoice.snap_token) {
      return NextResponse.json({ token: invoice.snap_token })
    }

    // 3. Siapkan data customer dari wali murid (jika ada)
    const guardian = invoice.students?.guardians
    const guardianUser = guardian?.users
    const customerFirstName = guardianUser?.first_name ?? invoice.students?.fullname ?? 'Wali'
    const customerLastName  = guardianUser?.last_name ?? ''
    const customerEmail     = guardianUser?.email ?? guardian?.email ?? 'noreply@yiss.id'
    const customerPhone     = guardianUser?.phone ?? guardian?.phone ?? ''

    // 4. Buat transaksi Midtrans Snap
    const authHeader = 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')

    const midtransPayload = {
      transaction_details: {
        order_id: `INV-${invoiceId.substring(0, 8)}-${Date.now()}`,
        gross_amount: Number(invoice.amount),
      },
      item_details: [
        {
          id: invoiceId,
          price: Number(invoice.amount),
          quantity: 1,
          name: invoice.description.substring(0, 50),
        },
      ],
      customer_details: {
        first_name: customerFirstName,
        last_name: customerLastName,
        email: customerEmail,
        phone: customerPhone,
      },
    }

    const midtransRes = await fetch(MIDTRANS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(midtransPayload),
    })

    const midtransData = await midtransRes.json()

    if (!midtransRes.ok) {
      console.error('Midtrans error:', midtransData)
      return NextResponse.json(
        { message: midtransData.error_messages?.join(', ') ?? 'Gagal membuat transaksi Midtrans' },
        { status: 502 }
      )
    }

    const snapToken = midtransData.token
    const orderId   = midtransPayload.transaction_details.order_id

    // 5. Simpan snap_token + order_id agar webhook bisa lookup by external_id
    await supabase
      .from('invoices')
      .update({ snap_token: snapToken, external_id: orderId, status: 'PENDING' })
      .eq('id', invoiceId)

    return NextResponse.json({ token: snapToken })
  } catch (err: any) {
    console.error('Token route error:', err)
    return NextResponse.json({ message: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
