import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const API_KEY = process.env.API_FOOTBALL_KEY
const API_BASE = 'https://v3.football.api-sports.io'

async function apiFetch(path: string) {
  if (!API_KEY) throw new Error('API_FOOTBALL_KEY non configurata in .env.local')
  // Exponential backoff for 429
  let delay = 2000
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${API_BASE}${path}`, { headers: { 'x-apisports-key': API_KEY } })
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, delay))
      delay *= 2
      continue
    }
    if (!res.ok) throw new Error(`API-Football ${res.status}: ${res.statusText}`)
    return res.json()
  }
  throw new Error('API-Football rate limit exceeded after 3 retries')
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type, season = '2026', league_id = '1', data } = body

  try {
    if (type === 'teams') {
      const json = await apiFetch(`/teams?league=${league_id}&season=${season}`)
      const teams = (json.response ?? []).map((t: { team: { id: number; name: string; logo: string }; venue: unknown }) => ({
        id: t.team.id,
        name: t.team.name,
        flag_url: t.team.logo,
      }))
      const { error } = await supabase.from('wc_teams').upsert(teams, { onConflict: 'id' })
      if (error) throw new Error(error.message)
      return NextResponse.json({ teams: teams.length })
    }

    if (type === 'players') {
      const { data: teams } = await supabase.from('wc_teams').select('id')
      let count = 0
      for (const team of (teams ?? [])) {
        const json = await apiFetch(`/players?team=${team.id}&league=${league_id}&season=${season}`)
        const players = (json.response ?? []).map((p: { player: { id: number; name: string }; statistics: Array<{ games: { position: string } }> }) => ({
          id: p.player.id,
          name: p.player.name,
          team_id: team.id,
          api_football_id: p.player.id,
          // role_fanta set separately via role_override.json
        }))
        if (players.length) {
          const { error } = await supabase.from('wc_players').upsert(players, { onConflict: 'id' })
          if (error) console.error('players upsert:', error.message)
          count += players.length
        }
      }
      return NextResponse.json({ players: count })
    }

    if (type === 'matches') {
      const json = await apiFetch(`/fixtures?league=${league_id}&season=${season}`)
      const matches = (json.response ?? []).map((f: {
        fixture: { id: number; date: string; status: { short: string } }
        league: { round: string }
        teams: { home: { id: number }; away: { id: number } }
        goals: { home: number | null; away: number | null }
        score: { penalty: { home: number | null; away: number | null } }
      }) => ({
        id: f.fixture.id,
        home_team_id: f.teams.home.id,
        away_team_id: f.teams.away.id,
        phase: f.league.round?.toLowerCase().includes('group') ? 'group'
          : f.league.round?.toLowerCase().includes('final') ? 'final'
          : f.league.round?.toLowerCase().includes('semi') ? 'sf'
          : f.league.round?.toLowerCase().includes('quarter') ? 'qf'
          : f.league.round?.toLowerCase().includes('round of 16') ? 'r16' : 'group',
        matchday: 1,
        status: f.fixture.status.short === 'FT' ? 'FT'
          : f.fixture.status.short === 'PEN' ? 'PEN'
          : f.fixture.status.short === '1H' || f.fixture.status.short === '2H' ? 'LIVE' : 'NS',
        played_at: f.fixture.date,
        home_score: f.goals.home,
        away_score: f.goals.away,
        home_score_pens: f.score.penalty.home,
        away_score_pens: f.score.penalty.away,
      }))
      const { error } = await supabase.from('wc_matches').upsert(matches, { onConflict: 'id' })
      if (error) throw new Error(error.message)
      return NextResponse.json({ matches: matches.length })
    }

    if (type === 'roles' && data) {
      // data: Array<{ player_id: number, role: 'P'|'D'|'C'|'A' }>
      let count = 0
      for (const entry of data) {
        const { error } = await supabase.from('wc_players')
          .update({ role_fanta: entry.role, role_override: true })
          .eq('id', entry.player_id)
        if (!error) count++
        else console.warn('role update warn:', error.message)
      }
      return NextResponse.json({ players: count })
    }

    return NextResponse.json({ error: 'Unknown import type' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
