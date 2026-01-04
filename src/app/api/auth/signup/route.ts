export const runtime = 'nodejs'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)



export async function POST(req: Request) {
  const body = await req.json()
  const { email, password, fullName } = body


  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }


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

  // 4️⃣ CREATE USER **AS ADMIN**
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message || 'Signup failed' },
      { status: 400 }
    )
  }

  // 5️⃣ CREATE PROFILE ROW (THIS WAS MISSING ❌)
  const { error: profileError } = await admin
  .from('profiles')
  .upsert(
    {
      user_id: data.user.id,
      email,
      name: fullName,
      tier: 'free',
      is_admin: false,
    },
    { onConflict: 'user_id' }
  )


  if (profileError) {
  console.error('PROFILE ERROR:', profileError)
  return NextResponse.json(
    { error: profileError.message },
    { status: 500 }
  )
}

  

  return NextResponse.json({ success: true })
}
