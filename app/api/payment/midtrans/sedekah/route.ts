import { NextRequest, NextResponse } from 'next/server'

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!
const MIDTRANS_MODE = process.env.NEXT_PUBLIC_MIDTRANS_MODE ?? 'sandbox'
const MIDTRANS_BASE_URL =
  MIDTRANS_MODE === 'production'
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

const SNAP_VTWEB_BASE =
  MIDTRANS_MODE === 'production'
    ? 'https://app.midtrans.com/snap/v2/vtweb'
    : 'https://app.sandbox.midtrans.com/snap/v2/vtweb'

export async function POST(request: NextRequest) {
  try {
    const { amount, customerName, customerEmail } = await request.json()

    if (!amount || Number(amount) < 10000) {
      return NextResponse.json({ message: 'Nominal minimal Rp 10.000' }, { status: 400 })
    }

    const authHeader = 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')

    const payload = {
      transaction_details: {
        order_id: `SEDEKAH-${Date.now()}`,
        gross_amount: Number(amount),
      },
      item_details: [
        {
          id: 'sedekah',
          price: Number(amount),
          quantity: 1,
          name: 'Sedekah',
        },
      ],
      customer_details: {
        first_name: customerName ?? 'Donatur',
        email: customerEmail ?? 'noreply@yiss.id',
      },
    }

    const res = await fetch(MIDTRANS_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { message: data.error_messages?.join(', ') ?? 'Gagal membuat transaksi' },
        { status: 502 }
      )
    }

    return NextResponse.json({ redirectUrl: `${SNAP_VTWEB_BASE}/${data.token}` })
  } catch (err: any) {
    return NextResponse.json({ message: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
