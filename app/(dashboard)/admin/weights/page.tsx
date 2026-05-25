import { createClient } from '@/lib/supabase/server'
import WeightsClient from './WeightsClient'
import type { AlgorithmWeight } from '@/lib/types/database.types'

// Lock date: 7 days before tournament start (Jun 11, 2026)
const LOCK_DATE = new Date('2026-06-04T00:00:00Z')

export default async function WeightsPage() {
  const supabase = await createClient()
  const { data: weights } = await supabase
    .from('algorithm_weights')
    .select('*')
    .order('role_fanta')
    .order('stat_name')

  const isLocked = new Date() >= LOCK_DATE

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pesi Algoritmo</h1>
          <p className="text-sm text-gray-500 mt-1">Modifica i pesi del motore di voto. Bloccati dal {LOCK_DATE.toLocaleDateString('it-IT')}.</p>
        </div>
        {isLocked && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
            🔒 Pesi bloccati
          </span>
        )}
      </div>

      {isLocked && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          I pesi sono in sola lettura. La data di blocco pre-torneo è passata.
        </div>
      )}

      <WeightsClient weights={(weights ?? []) as AlgorithmWeight[]} isLocked={isLocked} />
    </div>
  )
}
