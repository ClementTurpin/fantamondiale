import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Vote } from '@/lib/types/database.types'

const ROLE_STYLE: Record<string, string> = {
  P: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400',
  D: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  C: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400',
  A: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('wc_matches')
    .select('*, home_team:wc_teams!home_team_id(*), away_team:wc_teams!away_team_id(*)')
    .eq('id', id)
    .single()

  if (!match) notFound()

  const { data: stats } = await supabase
    .from('player_match_stats')
    .select('*, wc_players(id,name,role_fanta,team_id,wc_teams(name,flag_url))')
    .eq('match_id', id)

  const { data: votes } = await supabase
    .from('votes')
    .select('*, wc_players(id,name,role_fanta)')
    .eq('match_id', id)

  const voteMap = Object.fromEntries((votes ?? []).map((v: Vote) => [v.player_id, v]))

  const homeId = match.home_team_id
  const awayId = match.away_team_id

  const homePlayers = (stats ?? []).filter((s: { wc_players: { team_id: number } }) => s.wc_players?.team_id === homeId)
    .sort((a: { wc_players: { role_fanta: string } }, b: { wc_players: { role_fanta: string } }) => {
      const order = ['P','D','C','A']
      return order.indexOf(a.wc_players?.role_fanta) - order.indexOf(b.wc_players?.role_fanta)
    })
  const awayPlayers = (stats ?? []).filter((s: { wc_players: { team_id: number } }) => s.wc_players?.team_id === awayId)
    .sort((a: { wc_players: { role_fanta: string } }, b: { wc_players: { role_fanta: string } }) => {
      const order = ['P','D','C','A']
      return order.indexOf(a.wc_players?.role_fanta) - order.indexOf(b.wc_players?.role_fanta)
    })

  function PlayerRow({ s }: { s: typeof stats extends null ? never : NonNullable<typeof stats>[number] }) {
    const vote = voteMap[s.player_id]
    const role = s.wc_players?.role_fanta
    return (
      <Link href={`/player/${s.player_id}`}
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">
        <span className={`text-xs px-2 py-0.5 rounded font-semibold w-8 text-center ${ROLE_STYLE[role] ?? 'bg-gray-100 text-gray-600'}`}>{role}</span>
        <span className="flex-1 text-sm font-medium truncate">{s.wc_players?.name}</span>
        <span className="text-xs text-gray-400 shrink-0">{s.minutes}&apos;</span>
        {s.goals > 0 && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 px-1.5 py-0.5 rounded font-semibold">⚽ {s.goals}</span>}
        {s.assists > 0 && <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 px-1.5 py-0.5 rounded font-semibold">🎯 {s.assists}</span>}
        {s.yellowcards > 0 && <span className="text-xs">🟨</span>}
        {s.redcards > 0 && <span className="text-xs">🟥</span>}
        {vote?.details?.data_quality_warning && <span className="text-amber-500 text-xs" title="Dati parziali">⚠</span>}
        <div className="text-right shrink-0 w-12">
          {vote?.is_sv ? (
            <span className="text-xs text-gray-400">SV</span>
          ) : vote?.final_vote != null ? (
            <span className={`font-bold text-sm ${
              vote.final_vote >= 7 ? 'text-green-600 dark:text-green-400' :
              vote.final_vote < 5.5 ? 'text-red-600 dark:text-red-400' : ''
            }`}>{vote.final_vote.toFixed(2)}</span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-5">
      {/* Match header */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {match.home_team?.flag_url && <img src={match.home_team.flag_url} alt="" className="w-10 h-7 object-cover rounded" />}
            <span className="font-bold text-lg">{match.home_team?.name}</span>
          </div>
          <div className="text-center shrink-0">
            {match.home_score != null ? (
              <div>
                <span className="text-4xl font-black">{match.home_score}–{match.away_score}</span>
                {match.status === 'PEN' && (
                  <div className="text-sm text-purple-600 mt-1">Rigori: {match.home_score_pens}–{match.away_score_pens}</div>
                )}
              </div>
            ) : <span className="text-2xl text-gray-400">vs</span>}
            <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
              match.status === 'FT' || match.status === 'PEN' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
              match.status === 'LIVE' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
            }`}>{match.status}</div>
          </div>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="font-bold text-lg">{match.away_team?.name}</span>
            {match.away_team?.flag_url && <img src={match.away_team.flag_url} alt="" className="w-10 h-7 object-cover rounded" />}
          </div>
        </div>
      </div>

      {/* Player votes */}
      <div className="grid md:grid-cols-2 gap-4">
        {[{ team: match.home_team, players: homePlayers }, { team: match.away_team, players: awayPlayers }].map(({ team, players }) => (
          <div key={team?.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
              {team?.flag_url && <img src={team.flag_url} alt="" className="w-5 h-4 object-cover rounded" />}
              <span className="font-semibold text-sm">{team?.name}</span>
            </div>
            <div>{players.map((s: typeof stats extends null ? never : NonNullable<typeof stats>[number]) => <PlayerRow key={s.id} s={s} />)}</div>
            {!players.length && <div className="px-4 py-6 text-sm text-gray-400 text-center">Nessun dato disponibile</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
