import { createClient } from '@/lib/supabase/server'
import SimulateClient from './SimulateClient'
import type { AlgorithmWeight } from '@/lib/types/database.types'

export default async function SimulatePage() {
  const supabase = await createClient()
  const { data: weights } = await supabase
    .from('algorithm_weights')
    .select('role_fanta, stat_name, weight')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Simulazione Scenari</h1>
        <p className="text-sm text-gray-500 mt-1">
          10 scenari dalla spec (§ 2.4). Usali per testare l'algoritmo con i pesi attuali.
        </p>
      </div>
      <SimulateClient weights={(weights ?? []) as AlgorithmWeight[]} />
    </div>
  )
}
