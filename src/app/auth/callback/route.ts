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

  // 🔥 FORCE MUTABLE COOKIES (TypeScript-safe)
  const cookieStore = cookies() as unknown as {
    get: (name: string) => { value: string } | undefined
    set: (opts: { name: string; value: string } & CookieOptions) => void
    delete: (opts: { name: string } & CookieOptions) => void
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: name => cookieStore.get(name)?.value,
        set: (name, value, options) =>
          cookieStore.set({ name, value, ...options }),
        remove: (name, options) =>
          cookieStore.delete({ name, ...options }),
      },
    }
  )

  // 1️⃣ Exchange OAuth code
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error(exchangeError)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // 2️⃣ Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // 3️⃣ Check if new user
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isNewUser = !existingProfile

  // 4️⃣ Ensure profile exists
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

  // 5️⃣ Load config
  const { data: rows } = await admin
    .from('app_config')
    .select('key, value, value_int')

  const config = Object.fromEntries((rows ?? []).map(r => [r.key, r]))

  let blocked = false

  if (isNewUser && config.signup_open?.value === false) blocked = true

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

  if (blocked) {
    return NextResponse.redirect(`${origin}/signup-closed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
