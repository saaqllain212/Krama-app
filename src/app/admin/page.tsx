import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ---------- SERVER ACTIONS ----------
async function updateConfig(key: string, value: boolean | number) {
  'use server'

  if (typeof value === 'number') {
    await admin
      .from('app_config')
      .update({ value_int: value })
      .eq('key', key)
  } else {
    await admin
      .from('app_config')
      .update({ value })
      .eq('key', key)
  }

  revalidatePath('/admin')
}

// ---------- PAGE ----------
export default async function AdminPage() {
  const { data: configRows } = await admin
    .from('app_config')
    .select('key, value, value_int')

  const config = Object.fromEntries(
    (configRows ?? []).map(r => [r.key, r])
  )

  const { data: users } = await admin
    .from('profiles')
    .select('email, tier, is_admin, is_pro, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Admin Portal</h1>

      {/* ================= 1. METRICS (ADDED) ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="p-4 border rounded">
          <div className="text-xs text-gray-500">Total Users</div>
          <div className="text-2xl font-bold">{users?.length ?? 0}</div>
        </div>

        <div className="p-4 border rounded">
          <div className="text-xs text-gray-500">Free Users</div>
          <div className="text-2xl font-bold">
            {users?.filter(u => !u.is_admin && u.tier === 'free').length ?? 0}
          </div>
        </div>

        <div className="p-4 border rounded">
          <div className="text-xs text-gray-500">Pro Users</div>
          <div className="text-2xl font-bold">
            {users?.filter(u => !u.is_admin && u.tier === 'pro').length ?? 0}
          </div>
        </div>

        <div className="p-4 border rounded">
          <div className="text-xs text-gray-500">Admins</div>
          <div className="text-2xl font-bold">
            {users?.filter(u => u.is_admin).length ?? 0}
          </div>
        </div>
      </div>

      {/* ================= SIGNUP CONTROLS ================= */}
      <section className="border rounded p-6 space-y-4">
        <h2 className="text-lg font-semibold">Signup Controls</h2>

        {/* Text Status Info */}
        <div className="text-sm text-gray-600 space-y-1">
          <div>
            Signup Status:
            <b className="ml-2">
              {config.signup_open?.value ? 'OPEN' : 'CLOSED'}
            </b>
          </div>

          <div>
            User Cap:
            <b className="ml-2">
              {config.signup_cap_enabled?.value ? 'ENABLED' : 'DISABLED'}
            </b>
          </div>

          <div>
            Max Users:
            <b className="ml-2">
              {config.max_users?.value_int ?? 0}
            </b>
          </div>
        </div>

        {/* Open/Close Buttons */}
        <div className="flex gap-4">
          <form action={updateConfig.bind(null, 'signup_open', true)}>
            <button className="px-4 py-2 bg-green-600 text-white rounded">
              Open Signups
            </button>
          </form>

          <form action={updateConfig.bind(null, 'signup_open', false)}>
            <button className="px-4 py-2 bg-red-600 text-white rounded">
              Close Signups
            </button>
          </form>
        </div>

        {/* Cap Enable/Disable Buttons */}
        <div className="flex gap-4">
          <form action={updateConfig.bind(null, 'signup_cap_enabled', true)}>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded">
              Enable User Cap
            </button>
          </form>

          <form action={updateConfig.bind(null, 'signup_cap_enabled', false)}>
            <button className="px-4 py-2 bg-gray-600 text-white rounded">
              Disable User Cap
            </button>
          </form>
        </div>

        {/* Max User Input */}
        <form
          action={async (formData: FormData) => {
            'use server'
            const value = Number(formData.get('max'))
            await updateConfig('max_users', value)
          }}
          className="flex gap-2"
        >
          <input
            name="max"
            type="number"
            defaultValue={config.max_users?.value_int ?? 100}
            className="border px-2 py-1 w-32"
          />
          <button className="px-3 py-1 bg-black text-white rounded">
            Set Max Users
          </button>
        </form>

        {/* ================= 2. CURRENT STATUS BADGES (ADDED) ================= */}
        <div className="flex gap-4 pt-4 border-t mt-6 text-sm font-semibold">
          <span
            className={`px-3 py-1 rounded ${
              config.signup_open?.value
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            Signups: {config.signup_open?.value ? 'OPEN' : 'CLOSED'}
          </span>

          <span
            className={`px-3 py-1 rounded ${
              config.signup_cap_enabled?.value
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-600 text-white'
            }`}
          >
            Cap: {config.signup_cap_enabled?.value ? 'ON' : 'OFF'}
          </span>

          <span className="px-3 py-1 rounded bg-black text-white">
            Max: {config.max_users?.value_int ?? '∞'}
          </span>
        </div>
      </section>

      {/* ================= USER LIST ================= */}
      <section className="border rounded p-6">
        <h2 className="text-lg font-semibold mb-4">Users</h2>

        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">Email</th>
              <th className="p-2 border text-left">Tier</th>
              <th className="p-2 border text-left">Admin</th>
              <th className="p-2 border text-left">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u, i) => (
              <tr key={i} className="border-t">
                {/* ================= 3. UPDATED EMAIL CELL ================= */}
                <td className="p-2 border font-medium">
                  {u.email}
                  {u.is_admin && (
                    <span className="ml-2 text-red-600 font-bold">(ADMIN)</span>
                  )}
                </td>
                <td className="p-2 border">{u.tier}</td>
                <td className="p-2 border">
                  {u.is_admin ? 'YES' : 'NO'}
                </td>
                <td className="p-2 border">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}