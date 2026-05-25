import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">ADMIN</span>
          <span>Pannello di Amministrazione</span>
        </div>
        <nav className="flex gap-1 flex-wrap mt-2">
          {[
            { href: '/admin',            label: '📊 Overview' },
            { href: '/admin/import',     label: '⬇ Import' },
            { href: '/admin/weights',    label: '⚖ Pesi' },
            { href: '/admin/matches',    label: '⚽ Partite' },
            { href: '/admin/roles',      label: '🔄 Ruoli' },
            { href: '/admin/calibration',label: '🎯 Calibrazione' },
            { href: '/admin/simulate',   label: '🧪 Simulazione' },
          ].map(({ href, label }) => (
            <a key={href} href={href}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/40 dark:hover:text-green-400 transition-colors">
              {label}
            </a>
          ))}
        </nav>
      </div>
      {children}
    </div>
  )
}
