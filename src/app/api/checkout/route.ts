import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    // ✅ Read env vars safely at runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!supabaseUrl || !serviceRoleKey || !secret) {
      console.error('❌ Missing environment variables')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    // ✅ Create admin client ONLY at runtime
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    const text = await request.text()
    const signature = request.headers.get('x-razorpay-signature') as string

    // 1. Verify Signature (Security)
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('❌ Invalid Razorpay Signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // 2. Parse Event
    const event = JSON.parse(text)
    console.log('✅ Webhook received:', event.event)

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const email = payment.email
      const amount = payment.amount

      console.log(`💰 Payment captured for ${email}: ₹${amount / 100}`)

      // 3. Update Database (Grant Pro Access)
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          is_pro: true,
          plan: 'lifetime_pro',
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (error) {
        console.error('❌ DB Update Failed:', error)
        return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 })
      }

      console.log('🎉 User upgraded to Pro successfully')
    }

    return NextResponse.json({ status: 'ok' })

  } catch (err: any) {
    console.error('Webhook Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
