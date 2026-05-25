'use client'

import { useState } from 'react'
import { calculateVote, buildSimStats, type SimScenario } from '@/lib/rating-engine'
import type { AlgorithmWeight } from '@/lib/types/database.types'

const SCENARIOS: { id: SimScenario; label: string; icon: string }[] = [
  { id: 'standard',          label: 'Standard',              icon: '⚽' },
  { id: 'goal_fest',         label: 'Gol Fest (ATT)',         icon: '🎯' },
  { id: 'clean_sheet',       label: 'Clean Sheet (DEF)',      icon: '🛡' },
  { id: 'red_card',          label: 'Cartellino Rosso',       icon: '🟥' },
  { id: 'penalty_drama',     label: 'Rigore Fallito',         icon: '❌' },
  { id: 'early_sub',         label: 'Sub Precoce (8\')',      icon: '↩️' },
  { id: 'underdog_win',      label: 'Underdog (pass. bassa)', icon: '💪' },
  { id: 'goalkeeper_hero',   label: 'GK Eroe (8 parate)',     icon: '🧤' },
  { id: 'injury_early_exit', label: 'Infortunio (22\')',      icon: '🤕' },
  { id: 'penalty_shootout',  label: 'Rigori (PEN)',           icon: '🥅' },
]

type Result = { vote: number; isSv: boolean; role: string; bonuses: Record<string, number>; dqw: boolean }

export default function SimulateClient({ weights }: { weights: AlgorithmWeight[] }) {
  const [results, setResults] = useState<Record<SimScenario, Result>>({} as Record<SimScenario, Result>)
  const [active, setActive] = useState<SimScenario | null>(null)

  function run(scenario: SimScenario) {
    const { stats, role, matchStatus } = buildSimStats(scenario)
    const r = calculateVote(stats, role, weights as Parameters<typeof calculateVote>[2], matchStatus)
    setResults(prev => ({
      ...prev,
      [scenario]: {
        vote: r.final_vote,
        isSv: r.is_sv,
        role,
        bonuses: r.details?.bonuses ?? {},
        dqw: !!(r.details as { data_quality_warning?: boolean })?.data_quality_warning,
      },
    }))
    setActive(scenario)
  }

  function runAll() {
    SCENARIOS.forEach(s => run(s.id))
  }

  return (
    <div className="space-y-4">
      <button onClick={runAll}
        className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors">
        ▶ Esegui tutti gli scenari
      </button>

      <div className="grid sm:grid-cols-2 gap-3">
        {SCENARIOS.map(s => {
          const r = results[s.id]
          return (
            <div key={s.id}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${active === s.id ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/20' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] hover:border-green-300'}`}
              onClick={() => run(s.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{s.label}</div>
                    {r && <div className="text-xs text-gray-500 mt-0.5">Ruolo: {r.role}</div>}
                  </div>
                </div>
                {r ? (
                  <div className="text-right shrink-0">
                    {r.isSv ? (
                      <span className="text-gray-400 font-bold text-sm">SV</span>
                    ) : (
                      <span className="text-2xl font-black text-green-600 dark:text-green-400">{r.vote.toFixed(2)}</span>
                    )}
                    {r.dqw && <div className="text-xs text-amber-500 mt-0.5">⚠ dati parziali</div>}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Click per eseguire</span>
                )}
              </div>

              {r && !r.isSv && Object.entries(r.bonuses).filter(([, v]) => v !== 0).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1">
                  {Object.entries(r.bonuses)
                    .filter(([, v]) => v !== 0)
                    .map(([k, v]) => (
                      <span key={k} className={`text-xs px-1.5 py-0.5 rounded font-mono ${v > 0 ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
                        {k}: {v > 0 ? '+' : ''}{v.toFixed(1)}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
