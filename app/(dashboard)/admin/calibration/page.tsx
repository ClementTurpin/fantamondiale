import { createClient } from '@/lib/supabase/server'
import CalibrationClient from './CalibrationClient'
import type { AlgorithmWeight } from '@/lib/types/database.types'

export default async function CalibrationPage() {
  const supabase = await createClient()
  const { data: weights } = await supabase
    .from('algorithm_weights')
    .select('role_fanta, stat_name, weight')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Calibrazione Algoritmo</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verifica i 7 scenari di calibrazione dalla spec. Tutti devono passare prima del blocco pesi.
        </p>
      </div>
      <CalibrationClient weights={(weights ?? []) as AlgorithmWeight[]} />
    </div>
  )
}
