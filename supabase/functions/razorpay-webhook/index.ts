/// <reference lib="deno.ns" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --------------------
// CORS CONFIG (harmless, Razorpay ignores it)
// --------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

// --------------------
// EDGE FUNCTION
// --------------------
Deno.serve(async (req) => {
  // Razorpay sends POST only
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // --------------------
  // Read raw body (REQUIRED)
  // --------------------
  const bodyBuffer = await req.arrayBuffer();
  const bodyText = new TextDecoder().decode(bodyBuffer);

  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    console.error("Razorpay webhook: missing signature header");
    return new Response("Missing signature", {
      status: 400,
      headers: corsHeaders,
    });
  }

  // --------------------
  // Load webhook secret
  // --------------------
  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("Razorpay webhook: missing RAZORPAY_WEBHOOK_SECRET");
    return new Response("Webhook secret missing", {
      status: 500,
      headers: corsHeaders,
    });
  }

  // --------------------
  // Verify Razorpay signature (try Base64, then hex)
  // --------------------
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();

const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode(webhookSecret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["verify"]
);

const signatureBytes = Uint8Array.from(
  atob(signature),
  (c) => c.charCodeAt(0)
);

const isValid = await crypto.subtle.verify(
  "HMAC",
  key,
  signatureBytes,
  bodyBuffer
);

if (!isValid) {
  console.error("Razorpay webhook: signature mismatch");
  return new Response("Invalid webhook signature", { status: 401 });
}


  // --------------------
  // Parse event
  // --------------------
  const event = JSON.parse(bodyText);

  if (event.event !== "payment.captured") {
    return new Response("Ignored", {
      status: 200,
      headers: corsHeaders,
    });
  }

  // --------------------
  // Extract user_id
  // --------------------
  const payment = event.payload.payment.entity;
  const userId = payment.notes?.user_id;

  if (!userId) {
    return new Response("Missing user_id", {
      status: 400,
      headers: corsHeaders,
    });
  }

  // --------------------
  // Supabase service role client
  // --------------------
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // --------------------
  // ✅ FAIL-PROOF UPSERT (KEY FIX)
  // --------------------
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        tier: "pro",
        is_pro: true,
        pro_since: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    console.error("PROFILE UPSERT FAILED:", error);
    return new Response("Database error", {
      status: 500,
      headers: corsHeaders,
    });
  }

  // --------------------
  // Acknowledge webhook
  // --------------------
  return new Response("OK", {
    status: 200,
    headers: corsHeaders,
  });
});