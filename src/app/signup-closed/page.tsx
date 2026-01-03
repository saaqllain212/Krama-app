export default function SignupClosed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-stone-200 p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-bold">Signups Closed</h1>
        <p className="text-stone-400">
          Access is currently limited. Please try again later.
        </p>
        <a
          href="/login"
          className="inline-block mt-4 px-6 py-3 bg-stone-800 hover:bg-stone-700 rounded"
        >
          Return to Login
        </a>
      </div>
    </div>
  )
}
