'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AlgorithmWeight, RoleFanta } from '@/lib/types/database.types'

const ROLES: RoleFanta[] = ['P', 'D', 'C', 'A']
const ROLE_LABELS: Record<RoleFanta, string> = { P: 'Portiere', D: 'Difensore', C: 'Centrocampista', A: 'Attaccante' }

export default function WeightsClient({ weights: initial, isLocked }: { weights: AlgorithmWeight[]; isLocked: boolean }) {
  const [weights, setWeights] = useState(initial)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const supabase = createClient()

  async function save(w: AlgorithmWeight, value: number) {
    if (isLocked) return
    setSaving(w.id)
    const { error } = await supabase
      .from('algorithm_weights')
      .update({ weight: value })
      .eq('id', w.id)
    setSaving(null)
    if (error) {
      setMsg({ type: 'err', text: error.message })
    } else {
      setWeights(prev => prev.map(x => x.id === w.id ? { ...x, weight: value } : x))
      setMsg({ type: 'ok', text: `${w.role_fanta}.${w.stat_name} → ${value}` })
    }
    setTimeout(() => setMsg(null), 2500)
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`px-4 py-2 rounded-lg text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'}`}>
          {msg.type === 'ok' ? '✓' : '✗'} {msg.text}
        </div>
      )}

      {ROLES.map(role => {
        const roleWeights = weights.filter(w => w.role_fanta === role)
        return (
          <div key={role} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <span className="font-semibold text-sm">{role} — {ROLE_LABELS[role]}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Stat</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Peso</th>
                  {!isLocked && <th className="w-24 px-4 py-2 text-xs text-gray-500">Modifica</th>}
                </tr>
              </thead>
              <tbody>
                {roleWeights.map(w => (
                  <WeightRow key={w.id} weight={w} isLocked={isLocked}
                    saving={saving === w.id} onSave={val => save(w, val)} />
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

function WeightRow({ weight, isLocked, saving, onSave }: {
  weight: AlgorithmWeight; isLocked: boolean; saving: boolean
  onSave: (val: number) => void
}) {
  const [val, setVal] = useState(String(weight.weight))
  const changed = parseFloat(val) !== weight.weight && !isNaN(parseFloat(val))

  return (
    <tr className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
      <td className="px-4 py-2.5 font-mono text-xs">{weight.stat_name}</td>
      <td className={`px-4 py-2.5 text-right font-semibold text-sm ${weight.weight < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
        {weight.weight > 0 ? '+' : ''}{weight.weight}
      </td>
      {!isLocked && (
        <td className="px-4 py-2 text-right">
          <div className="flex items-center gap-1 justify-end">
            <input type="number" step="0.01" value={val}
              onChange={e => setVal(e.target.value)}
              className="w-20 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-right" />
            {changed && (
              <button onClick={() => onSave(parseFloat(val))} disabled={saving}
                className="px-2 py-1 text-xs rounded bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 transition-colors">
                {saving ? '…' : '✓'}
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}
