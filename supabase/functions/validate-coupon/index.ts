import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { couponCode, userId, basePrice } = await req.json();

    if (!couponCode || !userId || !basePrice) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Fetch coupon
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode)
      .eq("is_active", true)
      .single();

    if (couponError || !coupon) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid coupon code" }),
        { status: 200 }
      );
    }

    // 2️⃣ Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, message: "Coupon expired" }),
        { status: 200 }
      );
    }

    // 3️⃣ Check if user already used this coupon
    const { data: usage } = await supabase
      .from("coupon_usages")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (usage) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: "Coupon already used",
        }),
        { status: 200 }
      );
    }

    // 4️⃣ Calculate final price (min ₹1)
    const discount = coupon.discount_amount;
    let finalPrice = basePrice - discount;
    if (finalPrice < 1) finalPrice = 1;

    return new Response(
      JSON.stringify({
        valid: true,
        finalPrice,
        discountApplied: discount,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
});
