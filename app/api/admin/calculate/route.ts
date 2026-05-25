import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { calculateVote } from '@/lib/rating-engine'
import type { AlgorithmWeight, RoleFanta } from '@/lib/types/database.types'

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  const { match_id } = await req.json()

  try {
    const { data: weights } = await supabase.from('algorithm_weights').select('role_fanta,stat_name,weight')
    if (!weights?.length) return NextResponse.json({ error: 'No weights found' }, { status: 400 })

    let matchIds: number[] = []
    if (match_id) {
      matchIds = [match_id]
    } else {
      const { data: pending } = await supabase.from('wc_matches').select('id').in('status', ['FT','PEN']).eq('processed', false)
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
        const role: RoleFanta = row.wc_players?.role_fanta ?? null
        if (!role) { totalSkipped++; continue }

        try {
          const result = calculateVote(row, role, weights as AlgorithmWeight[], match.status)
          await supabase.from('votes').upsert({
            player_id: row.player_id, match_id: mid,
            role_fanta: role, base_score: 6.0,
            final_vote: result.is_sv ? null : result.final_vote,
            is_sv: result.is_sv, details: result.details,
          }, { onConflict: 'player_id,match_id' })
          result.is_sv ? totalSv++ : totalCalc++
        } catch { totalSkipped++ }
      }

      await supabase.from('wc_matches').update({ processed: true }).eq('id', mid)
    }

    return NextResponse.json({ calculated: totalCalc, sv: totalSv, skipped: totalSkipped, match_id: match_id ?? null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
