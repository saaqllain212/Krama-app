/// <reference lib="deno.ns" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --------------------
// CORS CONFIG
// --------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

// --------------------
// EDGE FUNCTION
// --------------------
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Read raw body
  const bodyText = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return new Response("Missing signature", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response("Webhook secret missing", {
      status: 500,
      headers: corsHeaders,
    });
  }

  // Verify signature
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

  if (expectedSignature !== signature) {
    return new Response("Invalid webhook signature", {
      status: 401,
      headers: corsHeaders,
    });
  }

  const event = JSON.parse(bodyText);

  if (event.event !== "payment.captured") {
    return new Response("Ignored", {
      status: 200,
      headers: corsHeaders,
    });
  }

  const payment = event.payload.payment.entity;
  const userId = payment.notes?.user_id;

  if (!userId) {
    return new Response("Missing user_id", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ✅ CORRECT COLUMN
  await supabase
    .from("profiles")
    .update({ tier: "pro", is_pro: true, pro_since: new Date().toISOString() })
    .eq("user_id", userId);

  return new Response("OK", {
    status: 200,
    headers: corsHeaders,
  });
});
