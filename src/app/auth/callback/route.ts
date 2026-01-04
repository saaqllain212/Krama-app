export const runtime = 'nodejs'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// 🔐 SERVICE ROLE CLIENT
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // ✅ IMPORTANT: cookies() is SYNC, but needs typing for TS
  const cookieStore = cookies() as any

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  // 1️⃣ Exchange OAuth code → session
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('OAUTH EXCHANGE ERROR:', exchangeError)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // 2️⃣ Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // 3️⃣ Check if profile already existed BEFORE upsert
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isNewUser = !existingProfile

  // 4️⃣ Ensure profile exists (idempotent, safe)
  await admin.from('profiles').upsert(
    {
      user_id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? '',
      tier: 'free',
      is_admin: false,
    },
    { onConflict: 'user_id' }
  )

  // 5️⃣ Load signup config
  const { data: rows } = await admin
    .from('app_config')
    .select('key, value, value_int')

  const config = Object.fromEntries((rows ?? []).map(r => [r.key, r]))

  let blocked = false

  // 🚫 Signup closed (new users only)
  if (isNewUser && config.signup_open?.value === false) {
    blocked = true
  }

  // 🚫 User cap (new users only)
  if (
    !blocked &&
    isNewUser &&
    config.signup_cap_enabled?.value === true
  ) {
    const { count } = await admin
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })

    if (
      count !== null &&
      config.max_users?.value_int &&
      count >= config.max_users.value_int
    ) {
      blocked = true
    }
  }

  // ⛔ Blocked users → redirect ONLY (no deletes, no signout)
  if (blocked) {
    return NextResponse.redirect(`${origin}/signup-closed`)
  }

  // ✅ Success
  return NextResponse.redirect(`${origin}${next}`)
}
