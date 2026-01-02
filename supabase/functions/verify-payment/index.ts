/// <reference lib="deno.ns" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  // --------------------
  // AUTH VALIDATION
  // --------------------
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid authorization header" }),
      { status: 401, headers: corsHeaders }
    );
  }

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: corsHeaders }
    );
  }

  // --------------------
  // REQUEST BODY
  // --------------------
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    user_id,
    coupon,
  } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !user_id) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (user.id !== user_id) {
    return new Response(
      JSON.stringify({ error: "User mismatch" }),
      { status: 403, headers: corsHeaders }
    );
  }

  // --------------------
  // SIGNATURE VERIFICATION (EDGE SAFE)
  // --------------------
  const secret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const encoder = new TextEncoder();

  const data = `${razorpay_order_id}|${razorpay_payment_id}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );

  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (generatedSignature !== razorpay_signature) {
    return new Response(
      JSON.stringify({ error: "Invalid payment signature" }),
      { status: 400, headers: corsHeaders }
    );
  }

  // --------------------
  // SERVICE ROLE CLIENT
  // --------------------
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // --------------------
  // IDEMPOTENT UPGRADE (FIXED TO USE user_id)
  // --------------------
  await supabase
    .from("profiles")
    .update({
      tier: "pro",
      is_pro: true,
      pro_since: new Date().toISOString(),
    })
    .eq("user_id", user_id)
    .neq("tier", "pro");

  // --------------------
  // COUPON LOCK (SAFE)
  // --------------------
  if (coupon) {
    const { data: couponRow } = await supabase
      .from("coupons")
      .select("id")
      .eq("code", coupon)
      .maybeSingle();

    if (couponRow) {
      await supabase
        .from("coupon_usages")
        .insert({
          coupon_id: couponRow.id,
          user_id,
        })
        .throwOnError();
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: corsHeaders }
  );
});