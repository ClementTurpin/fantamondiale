import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Vote } from '@/lib/types/database.types'

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: player } = await supabase
    .from('wc_players')
    .select('*, wc_teams(id,name,flag_url,group_name)')
    .eq('id', id)
    .single()

  if (!player) notFound()

  const { data: votes } = await supabase
    .from('votes')
    .select('*, wc_matches(id,matchday,phase,played_at,status,home_score,away_score,home_team:wc_teams!home_team_id(name,flag_url),away_team:wc_teams!away_team_id(name,flag_url))')
    .eq('player_id', id)
    .order('created_at', { ascending: false })

  const { data: stats } = await supabase
    .from('player_match_stats')
    .select('*')
    .eq('player_id', id)
    .order('created_at', { ascending: false })

  const statMap = Object.fromEntries((stats ?? []).map(s => [s.match_id, s]))

  const playedVotes = (votes ?? []).filter((v: Vote) => !v.is_sv && v.final_vote != null)
  const avg = playedVotes.length
    ? playedVotes.reduce((s: number, v: Vote) => s + (v.final_vote ?? 0), 0) / playedVotes.length
    : null

  const ROLE_STYLE: Record<string, string> = {
    P: 'bg-yellow-100 text-yellow-800', D: 'bg-blue-100 text-blue-800',
    C: 'bg-green-100 text-green-800',   A: 'bg-red-100 text-red-800',
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Profile header */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-black shrink-0">
            {player.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h1 className="text-2xl font-black">{player.name}</h1>
              {player.role_fanta && (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold mt-1 ${ROLE_STYLE[player.role_fanta] ?? ''}`}>
                  {player.role_fanta}
                </span>
              )}
              {player.role_override && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold mt-1 bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  override
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              {player.wc_teams?.flag_url && <img src={player.wc_teams.flag_url} alt="" className="w-5 h-4 object-cover rounded" />}
              <span className="text-sm text-gray-600 dark:text-gray-400">{player.wc_teams?.name}</span>
              {player.wc_teams?.group_name && <span className="text-xs text-gray-400">Gruppo {player.wc_teams.group_name}</span>}
            </div>
          </div>
          {avg != null && (
            <div className="text-center shrink-0">
              <div className={`text-4xl font-black ${avg >= 7 ? 'text-green-600 dark:text-green-400' : avg < 5.5 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>
                {avg.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Media ({playedVotes.length} partite)</div>
            </div>
          )}
        </div>
      </div>

      {/* Vote history */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <span className="font-semibold text-sm">Storico Voti</span>
        </div>
        {votes?.length ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {votes.map((v: Vote & { wc_matches?: { id: number; matchday: number; played_at: string | null; home_score: number | null; away_score: number | null; home_team?: { name: string; flag_url?: string }; away_team?: { name: string; flag_url?: string } } }) => {
              const m = v.wc_matches
              const s = statMap[v.match_id]
              return (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    {m ? (
                      <Link href={`/match/${m.id}`} className="text-sm font-medium hover:text-green-600 dark:hover:text-green-400 truncate block">
                        {m.home_team?.name} {m.home_score ?? '—'}–{m.away_score ?? '—'} {m.away_team?.name}
                      </Link>
                    ) : <span className="text-sm text-gray-500">Partita #{v.match_id}</span>}
                    {m?.played_at && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(m.played_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}Giornata {m.matchday}
                      </div>
                    )}
                  </div>
                  {s && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                      {s.goals > 0    && <span className="text-green-600">⚽ {s.goals}</span>}
                      {s.assists > 0  && <span className="text-blue-600">🎯 {s.assists}</span>}
                      {s.yellowcards > 0 && <span>🟨</span>}
                      {s.redcards > 0    && <span>🟥</span>}
                      <span>{s.minutes}&apos;</span>
                    </div>
                  )}
                  {v.details?.data_quality_warning && <span className="text-amber-500 text-xs" title="Dati parziali">⚠</span>}
                  <div className="w-14 text-right shrink-0">
                    {v.is_sv ? (
                      <span className="text-xs font-medium text-gray-400">SV</span>
                    ) : v.final_vote != null ? (
                      <span className={`text-lg font-black ${v.final_vote >= 7 ? 'text-green-600 dark:text-green-400' : v.final_vote < 5.5 ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {v.final_vote.toFixed(2)}
                      </span>
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Nessun voto disponibile per questo giocatore.</div>
        )}
      </div>
    </div>
  )
}
