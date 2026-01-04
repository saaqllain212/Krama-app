'use client'

import { useRouter } from 'next/navigation'

export default function AuthCodeErrorPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-stone-200 p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Failed</h1>
      <p className="text-stone-400 mb-6 text-center max-w-md">
        We couldn’t complete your sign-in. This usually happens if the login
        process was interrupted or expired.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-stone-800 hover:bg-stone-700 rounded"
        >
          Return to Login
        </button>

        <button
          onClick={() => router.push('/signup')}
          className="px-6 py-3 bg-red-900 hover:bg-red-800 rounded"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
