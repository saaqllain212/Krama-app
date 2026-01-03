import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient()

  // 1️⃣ Get auth user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2️⃣ Read profile using CORRECT column
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .maybeSingle()

  // 🔥 HARD FAIL PROOF
  if (profileError) {
    redirect('/dashboard')
  }

  if (!profile) {
    redirect('/dashboard')
  }

  if (profile.is_admin !== true) {
    redirect('/dashboard')
  }

  // ✅ Admin confirmed
  return user
}
