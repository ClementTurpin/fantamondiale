'use client'

import { useState } from 'react'
import { calculateVote, buildSimStats, type SimScenario } from '@/lib/rating-engine'
import type { AlgorithmWeight } from '@/lib/types/database.types'

// Calibration scenarios from spec § 2.2
const CALIBRATION_SCENARIOS: {
  scenario: SimScenario
  label: string
  pass: (vote: number, isSv: boolean, details?: unknown) => boolean
  condition: string
}[] = [
  {
    scenario: 'goalkeeper_hero',
    label: 'GK Hero: 8 save + clean sheet, 90 min',
    pass: (v) => v > 7.5,
    condition: '> 7.5',
  },
  {
    scenario: 'goal_fest',
    label: 'ATT: 2 gol, 90 min',
    pass: (v) => v > 8.5,
    condition: '> 8.5',
  },
  {
    scenario: 'red_card',
    label: 'DEF: cartellino rosso al 30\'',
    pass: (v) => v <= 4.0,
    condition: 'drop ≥ 2.0 da base (≤ 4.0)',
  },
  {
    scenario: 'early_sub',
    label: 'Any: sostituito all\'8\', nessun evento',
    pass: (_v, sv) => sv === true,
    condition: 'SV = true',
  },
  {
    scenario: 'penalty_drama',
    label: 'Any: rigore fallito (normale)',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pass: (_v, _sv, details) => ((details as any)?.bonuses?.['penalties_missed'] ?? 0) < 0,
    condition: 'malus visible in details',
  },
  {
    scenario: 'penalty_shootout',
    label: 'GK: 3 parate ai rigori, 0 errori (PEN)',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pass: (_v, _sv, details) => ((details as any)?.bonuses?.['pens_saved_shootout'] ?? 0) > 0,
    condition: 'bonus shootout visible',
  },
  {
    scenario: 'clean_sheet',
    label: 'DEF: entrato come titolare, nessun gol',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pass: (_v, _sv, details) => ((details as any)?.weights_contribution?.['clean_sheet'] ?? 0) > 0,
    condition: 'clean_sheet bonus presente',
  },
]

export default function CalibrationClient({ weights }: { weights: AlgorithmWeight[] }) {
  const [ran, setRan] = useState(false)
  const [results, setResults] = useState<Array<{
    scenario: SimScenario; label: string; condition: string
    vote: number; isSv: boolean; details: Record<string, unknown>; passed: boolean
  }>>([])

  function runAll() {
    const out = CALIBRATION_SCENARIOS.map(({ scenario, label, pass, condition }) => {
      const { stats, role, matchStatus } = buildSimStats(scenario)
      const result = calculateVote(stats, role, weights as Parameters<typeof calculateVote>[2], matchStatus)
      const passed = pass(result.final_vote, result.is_sv, result.details as unknown)
      return { scenario, label, condition, vote: result.final_vote, isSv: result.is_sv, details: result.details as unknown as Record<string, unknown>, passed }
    })
    setResults(out)
    setRan(true)
  }

  const allPassed = results.every(r => r.passed)

  return (
    <div className="space-y-4">
      <button onClick={runAll}
        className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors">
        🎯 Esegui calibrazione
      </button>

      {ran && (
        <>
          <div className={`px-4 py-3 rounded-xl border text-sm font-medium ${allPassed ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300'}`}>
            {allPassed ? '✅ Tutti i test passano — pesi pronti per il blocco' : `❌ ${results.filter(r => !r.passed).length} test falliti — rivedi i pesi`}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-gray-500">Scenario</th>
                  <th className="text-center px-4 py-2.5 font-medium text-xs text-gray-500">Voto</th>
                  <th className="text-center px-4 py-2.5 font-medium text-xs text-gray-500">Condizione</th>
                  <th className="text-center px-4 py-2.5 font-medium text-xs text-gray-500">Esito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {results.map(r => (
                  <tr key={r.scenario}>
                    <td className="px-4 py-3 text-xs">{r.label}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {r.isSv ? <span className="text-gray-400">SV</span> : r.vote.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-mono text-gray-500">{r.condition}</td>
                    <td className="px-4 py-3 text-center">
                      {r.passed
                        ? <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                        : <span className="text-red-600 dark:text-red-400 font-bold">✗</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
