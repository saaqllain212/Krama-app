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

  const cookieStore = await cookies()

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

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // ✅ ENSURE PROFILE EXISTS (GOOGLE USERS)
  await admin
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name ?? '',
        tier: 'free',
        is_admin: false,
      },
      { onConflict: 'user_id' }
    )


 

  // ✅ ONLY RELIABLE NEW-USER CHECK
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isNewUser = !existingProfile


  // Load config
  const { data: rows } = await admin
    .from('app_config')
    .select('key, value, value_int')

  const config = Object.fromEntries((rows ?? []).map(r => [r.key, r]))

  let blocked = false

  // 🚫 HARD BLOCK NEW USERS
  if (isNewUser && config.signup_open?.value === false) {
    blocked = true
  }

  // 🚫 CAP CHECK (NEW USERS ONLY)
  if (
    !blocked &&
    isNewUser &&
    config.signup_cap_enabled?.value === true
  ) {
    const { count } = await admin
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })

    if (
      count &&
      config.max_users?.value_int &&
      count >= config.max_users.value_int
    ) {
      blocked = true
    }
  }

  // ⛔ FINAL KILL SWITCH
  if (blocked) {
    await admin.from('profiles').delete().eq('user_id', user.id)
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/signup-closed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
