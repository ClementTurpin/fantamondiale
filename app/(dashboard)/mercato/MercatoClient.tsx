'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, ShoppingCart, X } from 'lucide-react'
import { cn, getRuoloColor, formatBudget } from '@/lib/utils'
import type { Giocatore, Ruolo } from '@/lib/types/database.types'

type Props = {
  giocatori: Giocatore[]
  iscrizioni: any[]
  rosaPropria: { giocatore_id: string; iscrizione_id: string }[]
}

export default function MercatoClient({ giocatori, iscrizioni, rosaPropria }: Props) {
  const [search, setSearch] = useState('')
  const [ruolo, setRuolo] = useState<Ruolo | 'ALL'>('ALL')
  const [selectedIsc, setSelectedIsc] = useState(iscrizioni[0]?.id ?? '')
  const [buying, setBuying] = useState<string | null>(null)
  const [notifica, setNotifica] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [localRosa, setLocalRosa] = useState(new Set(rosaPropria.filter(r => r.iscrizione_id === iscrizioni[0]?.id).map(r => r.giocatore_id)))
  const [localBudget, setLocalBudget] = useState<Record<string, number>>(
    Object.fromEntries(iscrizioni.map(i => [i.id, i.budget_rimanente ?? 0]))
  )

  const iscrizioneAttiva = iscrizioni.find(i => i.id === selectedIsc)
  const budget = localBudget[selectedIsc] ?? 0

  const filtered = useMemo(() => giocatori.filter(g => {
    const q = search.toLowerCase()
    return (ruolo === 'ALL' || g.ruolo === ruolo) &&
      (`${g.nome} ${g.cognome}`.toLowerCase().includes(q) || g.nazionalita.toLowerCase().includes(q))
  }), [giocatori, search, ruolo])

  const show = (msg: string, type: 'success' | 'error') => {
    setNotifica({ msg, type })
    setTimeout(() => setNotifica(null), 2500)
  }

  const acquista = async (g: Giocatore) => {
    if (localRosa.has(g.id)) return
    if (budget < g.quotazione) { show('Budget insufficiente!', 'error'); return }
    setBuying(g.id)
    const supabase = createClient()
    const { error } = await supabase.from('rosa').insert({ iscrizione_id: selectedIsc, giocatore_id: g.id, prezzo_acquisto: g.quotazione })
    if (error) { show('Errore: ' + error.message, 'error') }
    else {
      setLocalRosa(prev => new Set([...prev, g.id]))
      setLocalBudget(prev => ({ ...prev, [selectedIsc]: prev[selectedIsc] - g.quotazione }))
      show(`${g.nome} ${g.cognome} acquistato!`, 'success')
    }
    setBuying(null)
  }

  const vendi = async (g: Giocatore) => {
    const supabase = createClient()
    await supabase.from('rosa').delete().eq('iscrizione_id', selectedIsc).eq('giocatore_id', g.id)
    setLocalRosa(prev => { const n = new Set(prev); n.delete(g.id); return n })
    setLocalBudget(prev => ({ ...prev, [selectedIsc]: prev[selectedIsc] + g.quotazione }))
    show(`${g.cognome} venduto`, 'error')
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mercato</h1>
          <p className="text-sm text-gray-500 mt-0.5">Acquista i giocatori per la tua rosa</p>
        </div>
        {iscrizioneAttiva && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Budget</p>
            <p className="text-xl font-bold text-green-600">{formatBudget(budget)}</p>
          </div>
        )}
      </div>

      {iscrizioni.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {iscrizioni.map((i: any) => (
            <button key={i.id} onClick={() => { setSelectedIsc(i.id); setLocalRosa(new Set(rosaPropria.filter(r => r.iscrizione_id === i.id).map(r => r.giocatore_id))) }}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', selectedIsc === i.id ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200')}>
              {i.leghe?.nome ?? i.nome_squadra}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca giocatore o nazione..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161b22] text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['ALL','POR','DIF','CEN','ATT'] as const).map(r => (
            <button key={r} onClick={() => setRuolo(r)}
              className={cn('px-3 py-2 rounded-xl text-xs font-medium transition-colors', ruolo === r ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200')}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">{filtered.length} giocatori · {localRosa.size} in rosa</p>

      <div className="flex flex-col gap-2">
        {filtered.map(g => {
          const inRosa = localRosa.has(g.id)
          const affordable = budget >= g.quotazione
          return (
            <div key={g.id} className={cn('bg-white dark:bg-[#161b22] rounded-xl border p-4 flex items-center gap-4 transition-all',
              inRosa ? 'border-green-200 dark:border-green-800/50 bg-green-50/30' : 'border-gray-200 dark:border-gray-800')}>
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                {g.cognome.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm truncate">{g.nome} {g.cognome}</p>
                  <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border', getRuoloColor(g.ruolo))}>{g.ruolo}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{g.nazionalita}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">{formatBudget(g.quotazione)}</p>
              </div>
              <div className="shrink-0">
                {inRosa ? (
                  <button onClick={() => vendi(g)} className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Vendi</button>
                ) : (
                  <button onClick={() => acquista(g)} disabled={!affordable || buying === g.id || !selectedIsc}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      affordable && selectedIsc ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
                    <ShoppingCart size={12} />{buying === g.id ? '...' : 'Acquista'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {notifica && (
        <div className={cn('fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-50',
          notifica.type === 'success' ? 'bg-green-500' : 'bg-red-500')}>
          {notifica.msg}
        </div>
      )}
    </div>
  )
}
