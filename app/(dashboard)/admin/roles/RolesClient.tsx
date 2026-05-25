'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WcPlayer, RoleFanta } from '@/lib/types/database.types'

const ROLES: RoleFanta[] = ['P', 'D', 'C', 'A']
const ROLE_STYLE: Record<RoleFanta, string> = {
  P: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400',
  D: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  C: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400',
  A: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
}

export default function RolesClient({ players: initial }: { players: WcPlayer[] }) {
  const [players, setPlayers] = useState(initial)
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [newRole, setNewRole] = useState<RoleFanta>('C')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const supabase = createClient()

  const filtered = players.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.wc_teams as WcPlayer['wc_teams'])?.name?.toLowerCase().includes(search.toLowerCase())
  )

  function startEdit(p: WcPlayer) {
    setEditId(p.id)
    setNewRole((p.role_fanta as RoleFanta) ?? 'C')
    setReason('')
  }

  async function saveRole(p: WcPlayer) {
    if (!reason.trim()) { setMsg('Inserisci un motivo per il cambio ruolo'); return }
    setSaving(true)
    try {
      const { error: e1 } = await supabase.from('wc_players').update({ role_fanta: newRole, role_override: true }).eq('id', p.id)
      if (e1) throw e1
      await supabase.from('wc_player_role_changes').insert({
        player_id: p.id, old_role: p.role_fanta, new_role: newRole, reason: reason.trim()
      })
      setPlayers(prev => prev.map(x => x.id === p.id ? { ...x, role_fanta: newRole, role_override: true } : x))
      setMsg(`${p.name}: ${p.role_fanta} → ${newRole}`)
      setEditId(null)
    } catch (e) {
      setMsg(`Errore: ${String(e)}`)
    }
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca giocatore o squadra…"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
        <span className="px-3 py-2 text-xs text-gray-500 self-center">{filtered.length} gioc.</span>
      </div>

      {msg && (
        <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-xs">{msg}</div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-gray-500">Giocatore</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-gray-500">Squadra</th>
              <th className="text-center px-4 py-2.5 font-medium text-xs text-gray-500">Ruolo</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {p.role_override && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">override</span>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{(p.wc_teams as WcPlayer['wc_teams'])?.name ?? '—'}</td>
                <td className="px-4 py-2.5 text-center">
                  {editId === p.id ? (
                    <select value={newRole} onChange={e => setNewRole(e.target.value as RoleFanta)}
                      className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${p.role_fanta ? ROLE_STYLE[p.role_fanta as RoleFanta] : 'bg-gray-100 text-gray-500'}`}>
                      {p.role_fanta ?? '—'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {editId === p.id ? (
                    <div className="flex items-center gap-2">
                      <input value={reason} onChange={e => setReason(e.target.value)}
                        placeholder="Motivo*" className="w-32 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" />
                      <button onClick={() => saveRole(p)} disabled={saving}
                        className="px-2 py-1 text-xs rounded bg-green-500 hover:bg-green-600 text-white disabled:opacity-50">
                        {saving ? '…' : '✓'}
                      </button>
                      <button onClick={() => setEditId(null)} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(p)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/20 dark:hover:text-green-400 transition-colors">
                      Cambia
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
