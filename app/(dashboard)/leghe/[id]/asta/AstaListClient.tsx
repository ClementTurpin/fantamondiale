'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn, getRuoloColor, formatBudget } from '@/lib/utils'
import { Plus, Clock, Gavel, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Giocatore } from '@/lib/types/database.types'

type Iscrizione = { id: string; nome_squadra: string; budget_rimanente: number; utente_id: string }
type AstaWithRelations = any

type Props = {
  legaId: string
  myIscrizione: Iscrizione
  iscrizioni: Iscrizione[]
  initialAste: AstaWithRelations[]
  myRosa: any[]
  soldPlayerIds: string[]
  inAstaIds: string[]
}

function Countdown({ scadenza }: { scadenza: string }) {
  const [left, setLeft] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const tick = () => {
      const diff = new Date(scadenza).getTime() - Date.now()
      if (diff <= 0) { setLeft('Scaduta'); setExpired(true); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLeft(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [scadenza])

  return (
    <span className={cn('flex items-center gap-1 text-xs font-medium', expired ? 'text-red-500' : left.endsWith('s') ? 'text-orange-500' : 'text-gray-500')}>
      <Clock size={12} />{left}
    </span>
  )
}

export default function AstaListClient({ legaId, myIscrizione, iscrizioni, initialAste, myRosa, soldPlayerIds, inAstaIds }: Props) {
  const [aste, setAste] = useState<AstaWithRelations[]>(initialAste)
  const [showModal, setShowModal] = useState(false)
  const [selling, setSelling] = useState<any | null>(null)
  const [prezzoBase, setPrezzoBase] = useState(1)
  const [durataOre, setDurataOre] = useState(24)
  const [submitting, setSubmitting] = useState(false)
  const [notifica, setNotifica] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  const show = (msg: string, type: 'success' | 'error') => {
    setNotifica({ msg, type })
    setTimeout(() => setNotifica(null), 3000)
  }

  // Real-time: refresh auctions when aste or offerte change
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`asta-list-${legaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aste', filter: `lega_id=eq.${legaId}` }, async () => {
        const { data } = await supabase
          .from('aste')
          .select('*, giocatori(*), iscrizioni!venditore_iscrizione_id(nome_squadra)')
          .eq('lega_id', legaId)
          .eq('stato', 'attiva')
          .order('scadenza_at', { ascending: true })
        if (data) setAste(data)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'offerte' }, async () => {
        const { data } = await supabase
          .from('aste')
          .select('*, giocatori(*), iscrizioni!venditore_iscrizione_id(nome_squadra)')
          .eq('lega_id', legaId)
          .eq('stato', 'attiva')
          .order('scadenza_at', { ascending: true })
        if (data) setAste(data)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [legaId])

  const avviaAsta = async () => {
    if (!selling) return
    setSubmitting(true)
    const supabase = createClient()
    const scadenza = new Date(Date.now() + durataOre * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('aste').insert({
      lega_id: legaId,
      giocatore_id: selling.giocatori.id,
      venditore_iscrizione_id: myIscrizione.id,
      prezzo_base: prezzoBase,
      prezzo_attuale: prezzoBase,
      scadenza_at: scadenza,
    })
    if (error) { show('Errore: ' + error.message, 'error') }
    else {
      show(`${selling.giocatori.cognome} messo all'asta!`, 'success')
      setShowModal(false)
      setSelling(null)
      router.refresh()
    }
    setSubmitting(false)
  }

  const soldSet = new Set(soldPlayerIds)
  const inAstaSet = new Set(inAstaIds)
  const availableToSell = myRosa.filter(r => !inAstaSet.has(r.giocatore_id))

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{aste.length} aste attive</p>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus size={15} />Metti all'asta
        </button>
      </div>

      {/* Active auctions list */}
      {aste.length === 0 ? (
        <div className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <Gavel size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Nessuna asta attiva.</p>
          <p className="text-xs text-gray-300 mt-1">Metti un giocatore della tua rosa all'asta per iniziare.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {aste.map((asta: any) => {
            const g: Giocatore = asta.giocatori
            const seller = asta.iscrizioni?.nome_squadra ?? 'Sconosciuto'
            const topBidder = asta.migliore_offerta_iscrizione_id
              ? iscrizioni.find(i => i.id === asta.migliore_offerta_iscrizione_id)?.nome_squadra
              : null
            return (
              <Link key={asta.id} href={`/leghe/${legaId}/asta/${asta.id}`}
                className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4 hover:border-green-300 transition-colors group">
                <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {g.cognome.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{g.nome} {g.cognome}</p>
                    <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border', getRuoloColor(g.ruolo))}>{g.ruolo}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{g.nazionalita} · venduto da {seller}</p>
                  {topBidder && (
                    <p className="text-xs text-green-600 mt-0.5 font-medium">Miglior offerta: {topBidder}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-green-600">{formatBudget(asta.prezzo_attuale)}</p>
                  <Countdown scadenza={asta.scadenza_at} />
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-green-500 transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}

      {/* Create auction modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#161b22] rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">Metti un giocatore all'asta</h2>
              <button onClick={() => { setShowModal(false); setSelling(null) }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Player picker */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Scegli giocatore dalla tua rosa</label>
                {availableToSell.length === 0 ? (
                  <p className="text-sm text-gray-400">Nessun giocatore disponibile da mettere all'asta.</p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {availableToSell.map((r: any) => {
                      const g: Giocatore = r.giocatori
                      const selected = selling?.id === r.id
                      return (
                        <button key={r.id} onClick={() => setSelling(r)}
                          className={cn('flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                            selected ? 'border-green-400 bg-green-50 dark:bg-green-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300')}>
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                            {g.cognome.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{g.nome} {g.cognome}</p>
                            <p className="text-xs text-gray-400">{g.nazionalita}</p>
                          </div>
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', getRuoloColor(g.ruolo))}>{g.ruolo}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {selling && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">Prezzo base (M)</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPrezzoBase(p => Math.max(1, p - 1))} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg">-</button>
                      <input type="number" min={1} value={prezzoBase} onChange={e => setPrezzoBase(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 text-center py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                      <button onClick={() => setPrezzoBase(p => p + 1)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg">+</button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-2 block">Durata asta</label>
                    <div className="flex gap-2 flex-wrap">
                      {[1, 6, 12, 24, 48, 72].map(h => (
                        <button key={h} onClick={() => setDurataOre(h)}
                          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                            durataOre === h ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50')}>
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => { setShowModal(false); setSelling(null) }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Annulla
              </button>
              <button onClick={avviaAsta} disabled={!selling || submitting}
                className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors',
                  selling && !submitting ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed')}>
                {submitting ? 'Avvio...' : 'Avvia asta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notifica && (
        <div className={cn('fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-50',
          notifica.type === 'success' ? 'bg-green-500' : 'bg-red-500')}>
          {notifica.msg}
        </div>
      )}
    </div>
  )
}
