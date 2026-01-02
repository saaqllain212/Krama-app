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
  // Parse JSON body
  // --------------------
  let event: any;
  try {
    event = await req.json();
  } catch (err) {
    console.error("Invalid JSON payload", err);
    return new Response("Invalid JSON", {
      status: 400,
      headers: corsHeaders,
    });
  }

  // --------------------
  // Only handle successful captured payments
  // --------------------
  if (event.event !== "payment.captured") {
    return new Response("Ignored", {
      status: 200,
      headers: corsHeaders,
    });
  }

  const payment = event?.payload?.payment?.entity;

  if (!payment || payment.status !== "captured") {
    console.error("Invalid payment payload");
    return new Response("Invalid payment", {
      status: 400,
      headers: corsHeaders,
    });
  }

  // --------------------
  // Extract user_id from notes
  // --------------------
  const userId = payment.notes?.user_id;

  if (!userId) {
    console.error("Missing user_id in payment.notes");
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
  // ✅ FAIL-PROOF UPSERT (DO NOT TOUCH)
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
