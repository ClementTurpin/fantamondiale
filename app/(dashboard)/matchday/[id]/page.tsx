import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { WcMatch, Vote } from '@/lib/types/database.types'

export default async function MatchdayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const matchday = parseInt(id)
  if (isNaN(matchday)) notFound()

  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('wc_matches')
    .select('*, home_team:wc_teams!home_team_id(id,name,flag_url), away_team:wc_teams!away_team_id(id,name,flag_url)')
    .eq('matchday', matchday)
    .order('played_at')

  if (!matches?.length) notFound()

  const matchIds = matches.map(m => m.id)
  const { data: votes } = await supabase
    .from('votes')
    .select('*, wc_players(id,name,role_fanta)')
    .in('match_id', matchIds)
    .eq('is_sv', false)
    .order('final_vote', { ascending: false })

  const votesByMatch = (votes ?? []).reduce((acc: Record<number, Vote[]>, v: Vote) => {
    if (!acc[v.match_id]) acc[v.match_id] = []
    acc[v.match_id].push(v)
    return acc
  }, {})

  const PHASE_LABELS: Record<string, string> = {
    group: 'Fase a Gironi', r16: 'Ottavi di Finale', qf: 'Quarti di Finale',
    sf: 'Semifinale', final: 'Finale',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Giornata {matchday}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {matches.length} partite · {(votes ?? []).length} voti calcolati
        </p>
      </div>

      {matches.map((m: WcMatch) => {
        const matchVotes = votesByMatch[m.id] ?? []
        return (
          <div key={m.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] overflow-hidden">
            {/* Match header */}
            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  {m.home_team?.flag_url && <img src={m.home_team.flag_url} alt="" className="w-7 h-5 object-cover rounded" />}
                  <span className="font-semibold">{m.home_team?.name ?? '—'}</span>
                </div>
                <div className="text-center shrink-0">
                  {m.home_score != null ? (
                    <div>
                      <span className="text-2xl font-black">{m.home_score}–{m.away_score}</span>
                      {m.status === 'PEN' && <div className="text-xs text-purple-600">({m.home_score_pens}–{m.away_score_pens} R)</div>}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {m.played_at ? new Date(m.played_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                    </span>
                  )}
                  <div className="text-xs text-gray-400 mt-0.5">{PHASE_LABELS[m.phase] ?? m.phase}</div>
                </div>
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className="font-semibold">{m.away_team?.name ?? '—'}</span>
                  {m.away_team?.flag_url && <img src={m.away_team.flag_url} alt="" className="w-7 h-5 object-cover rounded" />}
                </div>
              </div>
            </div>

            {/* Player votes */}
            {matchVotes.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {matchVotes.slice(0, 10).map((v: Vote) => (
                  <Link key={v.id} href={`/player/${v.player_id}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      v.role_fanta === 'P' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400' :
                      v.role_fanta === 'D' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' :
                      v.role_fanta === 'C' ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' :
                      'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                    }`}>{v.role_fanta}</span>
                    <span className="flex-1 text-sm font-medium truncate">{v.wc_players?.name ?? '—'}</span>
                    {v.details?.data_quality_warning && <span title="Dati parziali" className="text-amber-500 text-xs">⚠</span>}
                    <span className={`font-bold text-sm shrink-0 ${
                      (v.final_vote ?? 0) >= 7 ? 'text-green-600 dark:text-green-400' :
                      (v.final_vote ?? 0) < 5.5 ? 'text-red-600 dark:text-red-400' : ''
                    }`}>
                      {v.final_vote?.toFixed(2) ?? '—'}
                    </span>
                  </Link>
                ))}
                {matchVotes.length > 10 && (
                  <Link href={`/match/${m.id}`}
                    className="flex items-center justify-center px-5 py-2.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors">
                    +{matchVotes.length - 10} altri voti →
                  </Link>
                )}
              </div>
            ) : (
              <div className="px-5 py-4 text-sm text-gray-400 text-center">
                {m.status === 'NS' ? 'Partita non ancora giocata' :
                 m.processed ? 'Nessun voto disponibile' : 'Voti non ancora calcolati'}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
