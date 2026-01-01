import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // 🔒 0. Allow ONLY POST
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      )
    }

    // 1️⃣ Read payload
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpaySignature,
      userId,
    } = await req.json()

    if (!orderCreationId || !razorpayPaymentId || !razorpaySignature || !userId) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    // 2️⃣ 🔐 Verify Razorpay signature
    const hmac = crypto.createHmac(
      'sha256',
      process.env.RAZORPAY_KEY_SECRET!
    )

    hmac.update(`${orderCreationId}|${razorpayPaymentId}`)
    const digest = hmac.digest('hex')

    if (digest !== razorpaySignature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // 3️⃣ ⚡ Create Supabase ADMIN client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4️⃣ 🔍 Ensure user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tier')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 403 }
      )
    }

    // 5️⃣ 🧱 Idempotent upgrade (NO double unlocks)
    if (profile.tier === 'pro') {
      return NextResponse.json({
        success: true,
        message: 'User already Pro',
      })
    }

    // 6️⃣ 👑 Upgrade user to PRO
    const { error: upgradeError } = await supabase
      .from('profiles')
      .update({
        tier: 'pro',
        pro_since: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .neq('tier', 'pro') // 🔒 prevents replay attacks

    if (upgradeError) {
      console.error('Upgrade failed:', upgradeError)
      return NextResponse.json(
        { error: 'Database upgrade failed' },
        { status: 500 }
      )
    }

    // 7️⃣ ✅ Success
    return NextResponse.json({
      success: true,
      message: 'Pro unlocked successfully',
    })

  } catch (err: any) {
    console.error('Verify error:', err)
    return NextResponse.json(
      { error: err.message || 'Verification failed' },
      { status: 500 }
    )
  }
}
