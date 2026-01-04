'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session?.user) {
        router.replace('/login')
        return
      }

      // profile creation already handled server-side
      router.replace('/dashboard')
    }

    run()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center text-stone-400">
      Completing sign-in…
    </div>
  )
}
