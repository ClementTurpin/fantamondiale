import { createClient } from '@/lib/supabase/server'
import MatchesClient from './MatchesClient'
import type { WcMatch } from '@/lib/types/database.types'

export default async function AdminMatchesPage() {
  const supabase = await createClient()
  const { data: matches } = await supabase
    .from('wc_matches')
    .select('*, home_team:wc_teams!home_team_id(id,name,flag_url), away_team:wc_teams!away_team_id(id,name,flag_url)')
    .order('matchday')
    .order('played_at')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Gestione Partite</h1>
        <p className="text-sm text-gray-500 mt-1">Calcola voti, imposta risultati, visualizza stato elaborazione.</p>
      </div>
      <MatchesClient matches={(matches ?? []) as WcMatch[]} />
    </div>
  )
}
