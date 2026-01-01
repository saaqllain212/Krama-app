import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type",
};

serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    const { couponCode, userId, basePrice } = await req.json();

    if (!couponCode || !userId || !basePrice) {
      return new Response(
        JSON.stringify({ valid: false, message: "Missing fields" }),
        { status: 200, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Fetch coupon
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode)
      .eq("is_active", true)
      .single();

    if (!coupon) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid coupon code" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 2️⃣ Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, message: "Coupon expired" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 3️⃣ Check usage
    const { data: used } = await supabase
      .from("coupon_usages")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (used) {
      return new Response(
        JSON.stringify({ valid: false, message: "Coupon already used" }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 4️⃣ Price calc
    let finalPrice = basePrice - coupon.discount_amount;
    if (finalPrice < 1) finalPrice = 1;

    return new Response(
      JSON.stringify({
        valid: true,
        finalPrice,
        discountApplied: coupon.discount_amount,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch {
    return new Response(
      JSON.stringify({ valid: false, message: "Internal error" }),
      { status: 200, headers: corsHeaders }
    );
  }
});
