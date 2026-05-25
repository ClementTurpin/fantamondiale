'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn, getRuoloColor, formatBudget } from '@/lib/utils'
import { Clock, Gavel, TrendingUp, User, Trophy, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Iscrizione = { id: string; nome_squadra: string; budget_rimanente: number; utente_id: string }

type Props = {
  asta: any
  myIscrizione: Iscrizione
  iscrizioni: Iscrizione[]
  initialOfferte: any[]
  initialStats: any[]
  isSeller: boolean
  legaId: string
}

function Countdown({ scadenza }: { scadenza: string }) {
  const [display, setDisplay] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    const tick = () => {
      const diff = new Date(scadenza).getTime() - Date.now()
      if (diff <= 0) { setDisplay('Asta scaduta'); setUrgent(true); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setUrgent(diff < 60000)
      setDisplay(h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [scadenza])

  return (
    <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono font-bold text-lg', urgent ? 'bg-red-50 text-red-600 dark:bg-red-950/30' : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200')}>
      <Clock size={18} className={urgent ? 'text-red-500' : 'text-gray-400'} />
      {display}
    </div>
  )
}

export default function AstaBidClient({ asta: initialAsta, myIscrizione, iscrizioni, initialOfferte, initialStats, isSeller, legaId }: Props) {
  const [asta, setAsta] = useState(initialAsta)
  const [offerte, setOfferte] = useState<any[]>(initialOfferte)
  const [bidding, setBidding] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [notifica, setNotifica] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  const show = (msg: string, type: 'success' | 'error') => {
    setNotifica({ msg, type })
    setTimeout(() => setNotifica(null), 3000)
  }

  const myBudget = iscrizioni.find(i => i.id === myIscrizione.id)?.budget_rimanente ?? myIscrizione.budget_rimanente
  const g = asta.giocatori
  const isExpired = new Date(asta.scadenza_at) <= new Date()
  const isClosed = asta.stato !== 'attiva'
  const canBid = !isSeller && !isClosed && !isExpired && myIscrizione.id !== asta.migliore_offerta_iscrizione_id
  const topBidder = asta.migliore_offerta_iscrizione_id
    ? iscrizioni.find(i => i.id === asta.migliore_offerta_iscrizione_id)
    : null
  const iAmWinning = asta.migliore_offerta_iscrizione_id === myIscrizione.id

  // Real-time: watch this auction and bids
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`asta-detail-${asta.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aste', filter: `id=eq.${asta.id}` }, (payload) => {
        setAsta((prev: any) => ({ ...prev, ...(payload.new as any) }))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'offerte', filter: `asta_id=eq.${asta.id}` }, async () => {
        const { data } = await supabase
          .from('offerte').select('*, iscrizioni(nome_squadra)')
          .eq('asta_id', asta.id).order('created_at', { ascending: false })
        if (data) setOfferte(data)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [asta.id])

  const placeBid = async (increment: number) => {
    const newAmount = asta.prezzo_attuale + increment
    if (newAmount > myBudget) { show('Budget insufficiente!', 'error'); return }
    setBidding(true)
    const supabase = createClient()
    const { error: bidErr } = await supabase.from('offerte').insert({
      asta_id: asta.id,
      iscrizione_id: myIscrizione.id,
      importo: newAmount,
    })
    if (bidErr) { show('Errore: ' + bidErr.message, 'error'); setBidding(false); return }
    const { error: updErr } = await supabase.from('aste').update({
      prezzo_attuale: newAmount,
      migliore_offerta_iscrizione_id: myIscrizione.id,
    }).eq('id', asta.id)
    if (updErr) { show('Errore aggiornamento: ' + updErr.message, 'error') }
    else {
      setAsta((prev: any) => ({ ...prev, prezzo_attuale: newAmount, migliore_offerta_iscrizione_id: myIscrizione.id }))
      show(`Offerta di ${formatBudget(newAmount)} piazzata!`, 'success')
    }
    setBidding(false)
  }

  const annullaAsta = async () => {
    setCancelling(true)
    const supabase = createClient()
    await supabase.from('aste').update({ stato: 'annullata' }).eq('id', asta.id)
    router.push(`/leghe/${legaId}/asta`)
  }

  // Aggregate stats
  const totGol = initialStats.reduce((s: number, p: any) => s + (p.gol ?? 0), 0)
  const totAssist = initialStats.reduce((s: number, p: any) => s + (p.assist ?? 0), 0)
  const avgVoto = initialStats.length > 0
    ? (initialStats.reduce((s: number, p: any) => s + (p.voto ?? 0), 0) / initialStats.filter((p: any) => p.voto).length || 0).toFixed(1)
    : null

  return (
    <div className="space-y-5">
      {/* Player card */}
      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-400 shrink-0">
            {g.cognome.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{g.nome} {g.cognome}</h2>
              <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-bold border', getRuoloColor(g.ruolo))}>{g.ruolo}</span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{g.nazionalita}</p>
            {initialStats.length > 0 && (
              <div className="flex items-center gap-4 mt-3">
                {avgVoto && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{avgVoto}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Voto medio</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{totGol}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Gol</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{totAssist}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Assist</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent performances */}
        {initialStats.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Ultime prestazioni</p>
            <div className="flex gap-2 flex-wrap">
              {initialStats.map((p: any) => (
                <div key={p.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-center min-w-[60px]">
                  <p className="text-xs text-gray-400">G{p.giornata}</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{p.punti_fantasy ?? p.voto ?? '-'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Auction status */}
      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Offerta attuale</p>
            <p className="text-3xl font-bold text-green-600">{formatBudget(asta.prezzo_attuale)}</p>
          </div>
          {!isClosed && <Countdown scadenza={asta.scadenza_at} />}
          {isClosed && (
            <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1.5 rounded-lg text-sm font-medium">
              {asta.stato === 'chiusa' ? 'Conclusa' : 'Annullata'}
            </span>
          )}
        </div>

        {topBidder && (
          <div className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm',
            iAmWinning ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400')}>
            {iAmWinning ? <Trophy size={15} /> : <User size={15} />}
            {iAmWinning ? 'Stai vincendo l\'asta!' : `Miglior offerente: ${topBidder.nome_squadra}`}
          </div>
        )}

        {/* Bid buttons */}
        {canBid && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Il tuo budget: <span className="font-semibold text-gray-700 dark:text-gray-200">{formatBudget(myBudget)}</span></p>
            <div className="grid grid-cols-3 gap-3">
              {[1, 5, 10].map(inc => {
                const next = asta.prezzo_attuale + inc
                const affordable = next <= myBudget
                return (
                  <button key={inc} onClick={() => placeBid(inc)} disabled={!affordable || bidding}
                    className={cn('py-3 rounded-xl font-bold text-base transition-all flex flex-col items-center gap-0.5',
                      affordable && !bidding
                        ? 'bg-green-500 hover:bg-green-600 active:scale-95 text-white shadow-sm shadow-green-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed')}>
                    <span className="text-lg">+{inc}M</span>
                    <span className={cn('text-[11px] font-normal', affordable ? 'text-green-100' : 'text-gray-400')}>{formatBudget(next)}</span>
                  </button>
                )
              })}
            </div>
            {bidding && <p className="text-xs text-center text-gray-400">Piazzamento offerta...</p>}
          </div>
        )}

        {iAmWinning && !isClosed && (
          <p className="text-xs text-center text-green-600 font-medium">Sei il miglior offerente. Se nessuno rilancia, vinci il giocatore!</p>
        )}

        {isSeller && !isClosed && (
          <button onClick={annullaAsta} disabled={cancelling}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm transition-colors">
            <XCircle size={15} />{cancelling ? 'Annullamento...' : 'Annulla asta'}
          </button>
        )}
      </div>

      {/* Bid history */}
      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <TrendingUp size={15} className="text-green-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Storico offerte</h3>
          <span className="ml-auto text-xs text-gray-400">{offerte.length} offerte</span>
        </div>
        {offerte.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">Nessuna offerta ancora.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {offerte.map((o: any, i: number) => {
              const isMe = o.iscrizione_id === myIscrizione.id
              return (
                <div key={o.id} className={cn('flex items-center gap-3 px-5 py-3.5', i === 0 && 'bg-green-50/50 dark:bg-green-950/10')}>
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    i === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>
                    {i === 0 ? <Gavel size={12} /> : (offerte.length - i)}
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium', isMe ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300')}>
                      {o.iscrizioni?.nome_squadra ?? 'Sconosciuto'}{isMe ? ' (tu)' : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className={cn('font-bold text-sm', i === 0 ? 'text-green-600' : 'text-gray-500')}>
                    {formatBudget(o.importo)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
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
