import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const [{ count: teams }, { count: players }, { count: matches }, { count: votes }, { count: weights }] =
    await Promise.all([
      supabase.from('wc_teams').select('*', { count: 'exact', head: true }),
      supabase.from('wc_players').select('*', { count: 'exact', head: true }),
      supabase.from('wc_matches').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('algorithm_weights').select('*', { count: 'exact', head: true }),
    ])

  const { data: recentJobs } = await supabase
    .from('vote_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: unprocessed } = await supabase
    .from('wc_matches')
    .select('id', { count: 'exact', head: true })
    .in('status', ['FT', 'PEN'])
    .eq('processed', false)

  const cards = [
    { label: 'Squadre WC', value: teams ?? 0,   icon: '🏳', href: '/admin/import' },
    { label: 'Giocatori',  value: players ?? 0,  icon: '👤', href: '/admin/import' },
    { label: 'Partite',    value: matches ?? 0,  icon: '⚽', href: '/admin/matches' },
    { label: 'Voti calc.', value: votes ?? 0,    icon: '📊', href: '/admin/matches' },
    { label: 'Pesi alg.',  value: weights ?? 0,  icon: '⚖',  href: '/admin/weights' },
    { label: 'Da calc.',   value: (unprocessed as unknown as { count: number })?.count ?? 0, icon: '⏳', href: '/admin/matches' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rating Engine — Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Motore di voto statistico per FIFA World Cup 2026</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <a key={c.label} href={c.href}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] hover:border-green-300 dark:hover:border-green-700 transition-colors">
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
          </a>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] p-4">
          <h2 className="font-semibold mb-3">Job recenti</h2>
          {recentJobs?.length ? (
            <div className="space-y-2">
              {recentJobs.map(j => (
                <div key={j.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Match #{j.match_id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    j.status === 'done'    ? 'bg-green-100 text-green-700' :
                    j.status === 'failed'  ? 'bg-red-100 text-red-700' :
                    j.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{j.status}</span>
                  {j.result && <span className="text-xs text-gray-500">{(j.result as {calculated:number}).calculated} voti</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nessun job ancora.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] p-4">
          <h2 className="font-semibold mb-3">Checklist pre-torneo</h2>
          <ul className="space-y-2 text-sm">
            {[
              { label: 'Squadre importate',   done: (teams ?? 0) > 0 },
              { label: 'Giocatori importati', done: (players ?? 0) > 0 },
              { label: 'Partite importate',   done: (matches ?? 0) > 0 },
              { label: 'Pesi calibrati',      done: (weights ?? 0) > 0 },
            ].map(item => (
              <li key={item.label} className="flex items-center gap-2">
                <span>{item.done ? '✅' : '⬜'}</span>
                <span className={item.done ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
