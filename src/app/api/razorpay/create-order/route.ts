// ✅ CRITICAL: Forces the server to use Node.js (Required for Razorpay)
export const runtime = 'nodejs';

import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Validate Keys
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("❌ SERVER ERROR: Razorpay Keys are missing.");
      return NextResponse.json({ error: "Server Misconfiguration" }, { status: 500 });
    }

    // 2. Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 3. Parse Request
    const body = await req.json();
    const { userId, coupon } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 🏷️ COUPON & PRICE CONFIGURATION
    // ---------------------------------------------------------
    // Prices are in PAISE (₹1 = 100 paise)
    // Example: 39900 = ₹399
    
    const PRICES: Record<string, number> = {
      BASE: 39900,       // Standard Price: ₹399
      
      // ✅ Add your coupons here:
      'PRO2026': 19900, // Coupon "WELCOME50" -> Price ₹199
      'SAAQLLAIN10': 100,        // Coupon "FREE" -> Price ₹1 (Razorpay min limit)
      'ATP299': 29900,   // Coupon "PRO2024" -> Price ₹299
    };
    // ---------------------------------------------------------

    // 4. Calculate Final Amount
    // If the coupon exists in our list, use that price. Otherwise, use BASE price.
    const amount = (coupon && PRICES[coupon]) ? PRICES[coupon] : PRICES.BASE;

    console.log(`Creating order for User: ${userId} | Coupon: ${coupon || 'NONE'} | Price: ₹${amount / 100}`);

    // 5. Create Order
    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${userId.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: userId,
        coupon: coupon || 'NONE'
      }
    });

    return NextResponse.json(order);

  } catch (error: any) {
    console.error("❌ CRITICAL ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Payment System Failure" }, 
      { status: 500 }
    );
  }
}