/// <reference lib="deno.ns" />

// Supabase Edge Runtime types
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
  // 1️⃣ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2️⃣ Only POST allowed
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // --------------------
  // ✅ AUTH VALIDATION (REQUIRED)
  // --------------------
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid authorization header" }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );

  const { data: { user }, error: authError } =
    await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // --------------------
  // 3️⃣ Read request body
  // --------------------
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    user_id,
  } = await req.json();

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !user_id
  ) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // ✅ Ensure caller is upgrading THEMSELF
  if (user.id !== user_id) {
    return new Response(
      JSON.stringify({ error: "User mismatch" }),
      {
        status: 403,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // --------------------
  // 4️⃣ Verify Razorpay signature
  // --------------------
  const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!secret) {
    return new Response(
      JSON.stringify({ error: "Razorpay secret missing" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

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

  const generatedSignature = Array.from(
    new Uint8Array(signatureBuffer)
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // ✅ Timing-safe compare
  const sigA = encoder.encode(generatedSignature);
  const sigB = encoder.encode(razorpay_signature);

  if (
    sigA.length !== sigB.length ||
    !crypto.timingSafeEqual(sigA, sigB)
  ) {
    return new Response(
      JSON.stringify({ error: "Invalid payment signature" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // --------------------
  // 5️⃣ Upgrade user to PRO (idempotent)
  // --------------------
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase
    .from("profiles")
    .update({ tier: "pro" })
    .eq("id", user_id)
    .neq("tier", "pro");

  if (error) {
    return new Response(
      JSON.stringify({ error: "Failed to upgrade user" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // --------------------
  // 6️⃣ Success
  // --------------------
  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
});
