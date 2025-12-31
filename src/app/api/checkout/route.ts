import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// NOTE: We use the ADMIN client here because we are writing to the DB securely.
// Ensure you have SUPABASE_SERVICE_ROLE_KEY in your .env.local file!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const signature = request.headers.get('x-razorpay-signature') as string;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

    // 1. Verify Signature (Security)
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error("❌ Invalid Razorpay Signature");
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Parse Event
    const event = JSON.parse(text);
    console.log("✅ Webhook received:", event.event);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const email = payment.email; // Razorpay sends the user's email
      const amount = payment.amount; // In paise (e.g., 39900 for ₹399)

      console.log(`💰 Payment captured for ${email}: ₹${amount / 100}`);

      // 3. Update Database (Grant Pro Access)
      // ⚠️ CHECK YOUR DATABASE: Is your table named 'profiles', 'users', or something else?
      // ⚠️ CHECK YOUR COLUMN: Is the column 'is_pro', 'plan', or 'subscription_status'?
      
      const { error } = await supabaseAdmin
        .from('profiles') // <--- CHANGE THIS IF YOUR TABLE IS NAMED 'users'
        .update({ 
          is_pro: true,             // <--- CHANGE THIS to match your column name
          plan: 'lifetime_pro',
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (error) {
        console.error("❌ DB Update Failed:", error);
        return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
      }

      console.log("🎉 User upgraded to Pro successfully");
    }

    return NextResponse.json({ status: 'ok' });

  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}