/// <reference lib="deno.ns" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --------------------
// CORS CONFIG
// --------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --------------------
// EDGE FUNCTION
// --------------------
Deno.serve(async (req) => {
  // 1️⃣ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2️⃣ Razorpay ONLY sends POST
  if (req.method !== "POST") {
    return new Response(
      "Method not allowed",
      { status: 405, headers: corsHeaders }
    );
  }

  // 3️⃣ Read raw body (REQUIRED for signature verification)
  const bodyText = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return new Response(
      "Missing signature",
      { status: 400, headers: corsHeaders }
    );
  }

  // 4️⃣ Load webhook secret
  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response(
      "Webhook secret missing",
      { status: 500, headers: corsHeaders }
    );
  }

  // 5️⃣ Verify Razorpay signature (HMAC SHA-256)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(bodyText)
  );

  const expectedSignature = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // ✅ Timing-safe comparison
  const sigA = encoder.encode(expectedSignature);
  const sigB = encoder.encode(signature);

  if (
    sigA.length !== sigB.length ||
    !crypto.timingSafeEqual(sigA, sigB)
  ) {
    return new Response(
      "Invalid webhook signature",
      { status: 400, headers: corsHeaders }
    );
  }

  // 6️⃣ Parse event
  const event = JSON.parse(bodyText);

  if (event.event !== "payment.captured") {
    return new Response(
      "Ignored",
      { status: 200, headers: corsHeaders }
    );
  }

  // 7️⃣ Extract payment + user
  const payment = event.payload.payment.entity;
  const userId = payment.notes?.user_id;

  if (!userId) {
    return new Response(
      "Missing user_id",
      { status: 400, headers: corsHeaders }
    );
  }

  // 8️⃣ Supabase service role client (CORRECT)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  await supabase
    .from("profiles")
    .update({ tier: "pro" })
    .eq("id", userId);

  // 9️⃣ Acknowledge webhook
  return new Response(
    "OK",
    { status: 200, headers: corsHeaders }
  );
});
