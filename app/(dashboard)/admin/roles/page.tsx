import { createClient } from '@/lib/supabase/server'
import RolesClient from './RolesClient'
import type { WcPlayer } from '@/lib/types/database.types'

export default async function AdminRolesPage() {
  const supabase = await createClient()
  const { data: players } = await supabase
    .from('wc_players')
    .select('*, wc_teams(id,name,flag_url,group_name)')
    .order('name')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Gestione Ruoli</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ogni modifica viene loggata con timestamp e motivo. I giocatori con ruolo manuale mostrano il badge <strong>override</strong>.
        </p>
      </div>
      <RolesClient players={(players ?? []) as WcPlayer[]} />
    </div>
  )
}
