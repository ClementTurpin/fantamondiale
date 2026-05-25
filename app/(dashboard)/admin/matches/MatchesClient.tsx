'use client'

import { useState } from 'react'
import type { WcMatch } from '@/lib/types/database.types'

const STATUS_STYLE: Record<string, string> = {
  NS:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  LIVE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400',
  FT:   'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  PEN:  'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
}

export default function MatchesClient({ matches }: { matches: WcMatch[] }) {
  const [calculating, setCalculating] = useState<number | null>(null)
  const [results, setResults] = useState<Record<number, string>>({})
  const [filter, setFilter] = useState<'all' | 'pending'>('all')

  async function calculate(matchId: number) {
    setCalculating(matchId)
    try {
      const res = await fetch('/api/admin/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setResults(prev => ({ ...prev, [matchId]: `✓ ${d.calculated} voti, ${d.sv} SV, ${d.skipped} skip` }))
    } catch (e) {
      setResults(prev => ({ ...prev, [matchId]: `✗ ${String(e)}` }))
    }
    setCalculating(null)
  }

  const visible = filter === 'pending'
    ? matches.filter(m => (m.status === 'FT' || m.status === 'PEN') && !m.processed)
    : matches

  const groups = visible.reduce((acc, m) => {
    const k = m.phase ?? 'group'
    if (!acc[k]) acc[k] = []
    acc[k].push(m)
    return acc
  }, {} as Record<string, WcMatch[]>)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(['all', 'pending'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {f === 'all' ? 'Tutte' : 'Da calcolare'}
          </button>
        ))}
        <span className="text-xs text-gray-500 ml-2">{visible.length} partite</span>
      </div>

      {Object.entries(groups).map(([phase, ms]) => (
        <div key={phase} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {phase}
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {ms.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status] ?? STATUS_STYLE['NS']}`}>
                  {m.status}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium truncate">{m.home_team?.name ?? '—'}</span>
                  {m.home_score != null && (
                    <span className="font-bold text-base shrink-0">
                      {m.home_score}–{m.away_score}
                      {m.status === 'PEN' && <span className="text-xs text-purple-600 ml-1">({m.home_score_pens}–{m.away_score_pens} R)</span>}
                    </span>
                  )}
                  <span className="font-medium truncate">{m.away_team?.name ?? '—'}</span>
                </div>
                <span className={`text-xs shrink-0 ${m.processed ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                  {m.processed ? '✓ elaborata' : 'non elab.'}
                </span>
                {(m.status === 'FT' || m.status === 'PEN') && (
                  <button
                    onClick={() => calculate(m.id)}
                    disabled={calculating === m.id}
                    className="px-2.5 py-1 text-xs rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 transition-colors shrink-0">
                    {calculating === m.id ? '…' : '⚡ Calcola'}
                  </button>
                )}
                {results[m.id] && (
                  <span className={`text-xs ${results[m.id].startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                    {results[m.id]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {visible.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-8">
          {filter === 'pending' ? 'Nessuna partita da calcolare.' : 'Nessuna partita trovata.'}
        </p>
      )}
    </div>
  )
}
