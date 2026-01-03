import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const body = await req.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()

  // 1️⃣ Read signup config
  const { data: configRows } = await admin
    .from('app_config')
    .select('key, value, value_int')

  const config = Object.fromEntries(
    (configRows || []).map(r => [r.key, r])
  )

  // 2️⃣ Enforce signup open / closed
  if (config.signup_open?.value === false) {
    return NextResponse.json(
      { error: 'Signups are currently closed' },
      { status: 403 }
    )
  }

  // 3️⃣ Enforce user cap
  if (config.signup_cap_enabled?.value === true) {
    const { count } = await admin
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })

    const maxUsers = config.max_users?.value_int

    if (maxUsers && count !== null && count >= maxUsers) {
      return NextResponse.json(
        { error: 'User limit reached' },
        { status: 403 }
      )
    }
  }

  // 4️⃣ Create user (safe client)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
