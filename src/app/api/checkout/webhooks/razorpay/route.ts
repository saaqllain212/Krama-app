export const runtime = 'edge';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js'; // Use admin client here if needed

export async function POST(request: Request) {
  const text = await request.text();
  const signature = request.headers.get('x-razorpay-signature') as string;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  // 1. Verify the call is actually from Razorpay (Security Check)
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(text)
    .digest('hex');

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 2. Process the event
  const event = JSON.parse(text);
  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const email = payment.email; // Assuming user email is passed in payment

    // 3. Update Database (Example: Set user as 'premium')
    // Note: You normally use a Service Role key for admin updates, 
    // but for now we log it to console to prove it works.
    console.log(`SUCCESS: Payment received from ${email} for amount ${payment.amount}`);
    
    // TODO: Add your Supabase update logic here
  }

  return NextResponse.json({ status: 'ok' });
}