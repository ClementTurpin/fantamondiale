import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface StandingRow {
  team_id: number
  name: string
  flag_url: string | null
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
}

function buildStandings(
  teams: { id: number; name: string; flag_url: string | null }[],
  matches: {
    home_team_id: number
    away_team_id: number
    home_score: number | null
    away_score: number | null
    status: string
  }[]
): StandingRow[] {
  const map: Record<number, StandingRow> = {}
  for (const t of teams) {
    map[t.id] = { team_id: t.id, name: t.name, flag_url: t.flag_url, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
  }

  for (const m of matches) {
    if ((m.status !== 'FT' && m.status !== 'PEN') || m.home_score == null || m.away_score == null) continue
    const h = map[m.home_team_id]
    const a = map[m.away_team_id]
    if (!h || !a) continue

    h.played++; a.played++
    h.gf += m.home_score; h.ga += m.away_score
    a.gf += m.away_score; a.ga += m.home_score

    if (m.home_score > m.away_score) {
      h.won++; h.pts += 3; a.lost++
    } else if (m.home_score < m.away_score) {
      a.won++; a.pts += 3; h.lost++
    } else {
      h.drawn++; h.pts++; a.drawn++; a.pts++
    }
  }

  return Object.values(map)
    .map(r => ({ ...r, gd: r.gf - r.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name))
}

export default async function StandingsPage({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params
  const groupName = group.toUpperCase()

  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('wc_teams')
    .select('id, name, flag_url, group_name')
    .eq('group_name', groupName)

  if (!teams?.length) notFound()

  const teamIds = teams.map(t => t.id)

  const { data: matches } = await supabase
    .from('wc_matches')
    .select('id, home_team_id, away_team_id, home_score, away_score, status, played_at')
    .eq('phase', 'group')
    .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
    .order('played_at')

  const standings = buildStandings(teams, matches ?? [])
  const groupMatches = (matches ?? []).filter(
    m => teamIds.includes(m.home_team_id) && teamIds.includes(m.away_team_id)
  )

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Gruppo {groupName}</h1>
        <p className="text-sm text-gray-500 mt-1">{teams.length} squadre · {groupMatches.length} partite</p>
      </div>

      {/* Standings table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <span className="font-semibold text-sm">Classifica</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-2 text-left w-6">#</th>
                <th className="px-4 py-2 text-left">Squadra</th>
                <th className="px-3 py-2 text-center">G</th>
                <th className="px-3 py-2 text-center">V</th>
                <th className="px-3 py-2 text-center">P</th>
                <th className="px-3 py-2 text-center">S</th>
                <th className="px-3 py-2 text-center">GF</th>
                <th className="px-3 py-2 text-center">GS</th>
                <th className="px-3 py-2 text-center">DR</th>
                <th className="px-4 py-2 text-center font-bold">Pt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {standings.map((row, i) => (
                <tr key={row.team_id} className={i < 2 ? 'bg-green-50/40 dark:bg-green-950/10' : ''}>
                  <td className="px-4 py-3 text-gray-400 text-center">
                    {i < 2 ? <span className="text-green-600 dark:text-green-400 font-semibold">{i + 1}</span> : i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.flag_url && <img src={row.flag_url} alt="" className="w-6 h-4 object-cover rounded shrink-0" />}
                      <span className="font-medium truncate">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-gray-500">{row.played}</td>
                  <td className="px-3 py-3 text-center">{row.won}</td>
                  <td className="px-3 py-3 text-center text-gray-500">{row.drawn}</td>
                  <td className="px-3 py-3 text-center text-gray-500">{row.lost}</td>
                  <td className="px-3 py-3 text-center">{row.gf}</td>
                  <td className="px-3 py-3 text-center text-gray-500">{row.ga}</td>
                  <td className={`px-3 py-3 text-center font-medium ${row.gd > 0 ? 'text-green-600 dark:text-green-400' : row.gd < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </td>
                  <td className="px-4 py-3 text-center font-black text-base">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-950/30 border border-green-300 dark:border-green-700" />
          <span className="text-xs text-gray-400">Qualificate agli ottavi</span>
        </div>
      </div>

      {/* Matches */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <span className="font-semibold text-sm">Partite del Girone</span>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {groupMatches.length ? groupMatches.map(m => {
            const home = teamMap[m.home_team_id]
            const away = teamMap[m.away_team_id]
            const played = m.status === 'FT' || m.status === 'PEN'
            return (
              <Link key={m.id} href={`/match/${m.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-sm font-medium">{home?.name}</span>
                  {home?.flag_url && <img src={home.flag_url} alt="" className="w-6 h-4 object-cover rounded shrink-0" />}
                </div>
                <div className="text-center shrink-0 w-16">
                  {played ? (
                    <span className="font-bold text-sm">{m.home_score}–{m.away_score}</span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {m.played_at ? new Date(m.played_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : 'TBD'}
                    </span>
                  )}
                  <div className={`text-xs mt-0.5 ${played ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    {m.status}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  {away?.flag_url && <img src={away.flag_url} alt="" className="w-6 h-4 object-cover rounded shrink-0" />}
                  <span className="text-sm font-medium">{away?.name}</span>
                </div>
              </Link>
            )
          }) : (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Nessuna partita trovata per questo girone.</div>
          )}
        </div>
      </div>
    </div>
  )
}
