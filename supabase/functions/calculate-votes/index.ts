// Supabase Edge Function — calculate-votes
// Deno/TypeScript — no Node.js imports
// Spec: Fantamondiale2026_Prompt_v4.docx Milestone 2.3

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Algorithm weights cache ───────────────────────────────────
type RoleFanta = 'P' | 'D' | 'C' | 'A'

interface Weight { role_fanta: RoleFanta; stat_name: string; weight: number }
interface Stats  { [key: string]: number | boolean | string }

async function loadWeights(): Promise<Weight[]> {
  const { data, error } = await supabase.from('algorithm_weights').select('role_fanta,stat_name,weight')
  if (error) throw new Error(`weights load failed: ${error.message}`)
  return (data ?? []) as Weight[]
}

// ── Core vote calculation (mirrors lib/rating-engine.ts) ──────
function hasRelevantEvent(s: Stats, role: RoleFanta): boolean {
  return (
    (s.goals as number) > 0 || (s.assists as number) > 0 ||
    (s.yellowcards as number) > 0 || (s.redcards as number) > 0 ||
    (s.penalties_scored as number) > 0 || (s.penalties_missed as number) > 0 ||
    (s.own_goals as number) > 0 || (role === 'P' && (s.saves as number) > 0)
  )
}

function calcVote(s: Stats, role: RoleFanta, weights: Weight[], matchStatus: string) {
  const isPen = matchStatus === 'PEN'
  const rw = weights.filter(w => w.role_fanta === role)

  if ((s.minutes as number) < 12) {
    if (!hasRelevantEvent(s, role)) return { final_vote: null, is_sv: true, details: {} }
    if ((role === 'P' || role === 'D') && (s.goals_conceded as number) > 0) {
      const gcW = rw.find(w => w.stat_name === 'goals_conceded')?.weight ?? 0
      return { final_vote: 6.0 + (s.goals_conceded as number) * gcW, is_sv: false, details: { goals_conceded: (s.goals_conceded as number) * gcW } }
    }
  }

  let score = 6.0
  const wc: Record<string, number> = {}

  for (const w of rw) {
    if (w.stat_name === 'clean_sheet' || w.stat_name === 'penalties_saved') continue
    const raw = w.stat_name === 'passes_accuracy'
      ? ((s.passes_accuracy as number) ?? 0) - 70
      : ((s[w.stat_name] as number) ?? 0)
    const c = raw * w.weight
    wc[w.stat_name] = c
    score += c
  }

  // Clean sheet
  const csW = rw.find(w => w.stat_name === 'clean_sheet')?.weight ?? 0
  if (csW > 0 && s.clean_sheet) {
    const eligible = role === 'P'
      ? (s.minutes as number) >= 60
      : role === 'D'
        ? (s.minutes as number) >= 60 && (s.entered_at_minute as number) === 0
        : false
    if (eligible) { wc['clean_sheet'] = csW; score += csW }
  }

  // Bonuses
  const bonuses: Record<string, number> = {}
  bonuses['goals']   = (s.goals as number)   * 3.0
  bonuses['assists'] = (s.assists as number) * 1.0
  if ((s.yellowcards as number) > 0) bonuses['yellowcards'] = (s.yellowcards as number) * -0.5
  if ((s.redcards    as number) > 0) bonuses['redcards']    = (s.redcards    as number) * -2.0
  if ((s.own_goals   as number) > 0) bonuses['own_goals']   = (s.own_goals   as number) * -2.0
  if ((s.penalties_missed as number) > 0) bonuses['penalties_missed'] = (s.penalties_missed as number) * -3.0
  if (role === 'P' && (s.penalties_saved as number) > 0) {
    const psW = rw.find(w => w.stat_name === 'penalties_saved')?.weight ?? 3.0
    bonuses['penalties_saved'] = (s.penalties_saved as number) * psW
  }
  if (isPen) {
    if ((s.penalties_scored_shootout as number) > 0) bonuses['pens_scored_shootout'] = (s.penalties_scored_shootout as number) * 0.5
    if ((s.penalties_missed_shootout as number) > 0) bonuses['pens_missed_shootout'] = (s.penalties_missed_shootout as number) * -1.0
    if (role === 'P' && (s.penalties_saved_shootout as number) > 0) bonuses['pens_saved_shootout'] = (s.penalties_saved_shootout as number) * 1.5
  }

  score += Object.values(bonuses).reduce((a, b) => a + b, 0)
  const dqw = (s.data_quality as string) === 'partial'

  return {
    final_vote: score,
    is_sv: false,
    details: { weights_contribution: wc, bonuses, ...(dqw ? { data_quality_warning: true } : {}) }
  }
}

// ── Main handler ──────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  let matchId: number | undefined
  try {
    const body = await req.json()
    matchId = body?.match_id
  } catch { /* no body — process all pending */ }

  try {
    const weights = await loadWeights()
    let matchIds: number[] = []

    if (matchId) {
      matchIds = [matchId]
    } else {
      // Enqueue all FT/PEN unprocessed matches
      const { data: pending } = await supabase
        .from('wc_matches')
        .select('id')
        .in('status', ['FT', 'PEN'])
        .eq('processed', false)
      matchIds = (pending ?? []).map((m: { id: number }) => m.id)
    }

    let totalCalc = 0, totalSv = 0, totalSkipped = 0

    for (const mid of matchIds) {
      const { data: match } = await supabase.from('wc_matches').select('status').eq('id', mid).single()
      if (!match) { totalSkipped++; continue }

      const { data: statsRows } = await supabase
        .from('player_match_stats')
        .select('*, wc_players(role_fanta)')
        .eq('match_id', mid)

      for (const row of (statsRows ?? [])) {
        const role: RoleFanta = row.wc_players?.role_fanta ?? 'C'
        if (!row.wc_players?.role_fanta) { totalSkipped++; continue }

        try {
          const result = calcVote(row, role, weights, match.status)
          await supabase.from('votes').upsert({
            player_id: row.player_id,
            match_id: mid,
            role_fanta: role,
            base_score: 6.0,
            final_vote: result.final_vote,
            is_sv: result.is_sv,
            details: result.details,
          }, { onConflict: 'player_id,match_id' })

          result.is_sv ? totalSv++ : totalCalc++
        } catch {
          totalSkipped++
        }
      }

      await supabase.from('wc_matches').update({ processed: true }).eq('id', mid)
    }

    return Response.json({ calculated: totalCalc, sv: totalSv, skipped: totalSkipped, match_id: matchId ?? null })
  } catch (err) {
    console.error('calculate-votes error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
})
