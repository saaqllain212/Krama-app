import { requireAdmin } from '@/lib/guards/requireAdmin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {children}
    </div>
  )
}
