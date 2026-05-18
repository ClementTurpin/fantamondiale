import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Users, Target, TrendingUp, Plus, ArrowRight, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { formatBudget } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: iscrizioni }, { data: leghe }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('iscrizioni').select('*, leghe(*)').eq('utente_id', user.id),
    supabase.from('leghe').select('*').eq('admin_id', user.id),
  ])

  const { count } = await supabase.from('rosa').select('id', { count: 'exact' })
    .in('iscrizione_id', (iscrizioni ?? []).map(i => i.id))

  const stats = [
    { label: 'Leghe attive',      value: iscrizioni?.length ?? 0, icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Giocatori in rosa', value: count ?? 0,               icon: Target,     color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Leghe create',      value: leghe?.length ?? 0,       icon: Trophy,     color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Giornata attiva',   value: 1,                         icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ciao, {profile?.username ?? 'campione'} 👋</h1>
        <p className="text-gray-500 text-sm mt-0.5">Ecco il riepilogo del tuo FantaMondiale</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={17} className={s.color} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Le mie leghe</h2>
          <Link href="/leghe/crea" className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium hover:underline">
            <Plus size={13} />Crea lega
          </Link>
        </div>
        {(!iscrizioni || iscrizioni.length === 0) ? (
          <div className="bg-white dark:bg-[#161b22] rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <Trophy size={28} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Non sei in nessuna lega ancora</p>
            <div className="flex gap-2 justify-center">
              <Link href="/leghe/crea" className="text-xs bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium">Crea una lega</Link>
              <Link href="/leghe/join" className="text-xs border border-gray-200 text-gray-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50">Unisciti con codice</Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {iscrizioni.map((i: any) => (
              <Link key={i.id} href={`/leghe/${i.lega_id}`}
                className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-green-300 transition-colors group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{i.leghe?.nome ?? 'Lega'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{i.nome_squadra}</p>
                  </div>
                  <p className="text-xs font-medium text-green-600">{formatBudget(i.budget_rimanente ?? 0)} rimasti</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={11} />{i.leghe?.max_partecipanti ?? '?'} max</span>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Azioni rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/mercato',    label: 'Vai al mercato',    icon: ShoppingCart },
            { href: '/formazione', label: 'Schiera formazione', icon: Target },
            { href: '/leghe/crea', label: 'Crea lega',          icon: Plus },
            { href: '/classifica', label: 'Classifica',          icon: TrendingUp },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-green-300 transition-all group text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-2.5 group-hover:bg-green-50 transition-colors">
                <a.icon size={18} className="text-gray-500 group-hover:text-green-600 transition-colors" />
              </div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
