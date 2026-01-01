// Supabase Edge Runtime types
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

  // 2️⃣ Only allow POST
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

  // 3️⃣ Read request body
  const { amount } = await req.json();

  if (!amount) {
    return new Response(
      JSON.stringify({ error: "Amount is required" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 4️⃣ Load Razorpay secrets
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!keyId || !keySecret) {
    return new Response(
      JSON.stringify({ error: "Razorpay keys missing in Supabase secrets" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 5️⃣ Create Razorpay order (REST API)
  const auth = btoa(`${keyId}:${keySecret}`);

  const razorpayResponse = await fetch(
    "https://api.razorpay.com/v1/orders",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100, // INR → paise
        currency: "INR",
        receipt: `krama_${Date.now()}`,
      }),
    }
  );

  const orderData = await razorpayResponse.json();

  // 6️⃣ Return Razorpay order to frontend
  return new Response(
    JSON.stringify(orderData),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
});
