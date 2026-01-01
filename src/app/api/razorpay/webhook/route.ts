export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// --- DEBUG: VERIFY ENVIRONMENT VARIABLES ---
// If these log as 'undefined', your .env file is not loaded or variable names are wrong.
if (!process.env.RAZORPAY_WEBHOOK_SECRET) console.error("❌ CRITICAL: RAZORPAY_WEBHOOK_SECRET is missing!");
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) console.error("❌ CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing!");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.error("❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!");

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature') as string;
    
    // ⚠️ Ensure this matches exactly what is in your .env.local file
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("❌ Webhook Secret is undefined. Check .env variables.");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 1️⃣ Verify Razorpay Signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error("❌ Invalid Signature. Potential attack.");
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2️⃣ Parse Event
    const event = JSON.parse(body);

    // Only process successful captures
    if (event.event !== 'payment.captured') {
      return NextResponse.json({ status: 'ignored' });
    }

    const payment = event.payload.payment.entity;

    // 3️⃣ Extract USER ID from notes
    // Make sure your frontend sends 'user_id' in the 'notes' object during checkout!
    const userId = payment.notes?.user_id;

    if (!userId) {
      console.error('❌ No user_id found in payment notes. Payment ID:', payment.id);
      return NextResponse.json({ error: 'user_id missing' }, { status: 400 });
    }

    // 4️⃣ Create Supabase ADMIN client (Service Role)
    // Note: using NEXT_PUBLIC_SUPABASE_URL for the URL is fine/standard.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 5️⃣ Unlock PRO
    console.log(`⚡ Attempting to upgrade User: ${userId}...`);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ tier: 'pro' }) // This writes 'pro' to the 'tier' column
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('❌ Supabase update failed:', error.message);
      return NextResponse.json({ error: 'db update failed' }, { status: 500 });
    }

    // Check if a row was actually found and updated
    if (!data || data.length === 0) {
      console.error(`❌ Update ran but no row matched user_id: ${userId}. Does this user exist in 'profiles'?`);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    console.log(`✅ SUCCESS: PRO UNLOCKED for user ${userId}`);
    return NextResponse.json({ status: 'ok' });

  } catch (err: any) {
    console.error("❌ Unexpected Webhook Error:", err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}