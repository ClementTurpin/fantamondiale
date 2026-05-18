'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Search } from 'lucide-react'
import Link from 'next/link'

export default function JoinLegaPage() {
  const [codice, setCodice] = useState('')
  const [nomeSquadra, setNomeSquadra] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lega, setLega] = useState<any>(null)
  const router = useRouter()

  const cercaLega = async () => {
    if (!codice.trim()) return
    setLoading(true)
    setError(null)
    setLega(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leghe').select('*, iscrizioni(count)').eq('codice_invito', codice.toUpperCase().trim()).single()

    if (error || !data) {
      setError('Codice non valido. Controlla e riprova.')
    } else {
      setLega(data)
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!lega || !nomeSquadra.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Controlla se già iscritto
    const { data: existing } = await supabase.from('iscrizioni')
      .select('id').eq('lega_id', lega.id).eq('utente_id', user.id).single()
    if (existing) { setError('Sei già iscritto a questa lega!'); setLoading(false); return }

    const partecipanti = lega.iscrizioni?.[0]?.count ?? 0
    if (partecipanti >= lega.max_partecipanti) { setError('Lega piena!'); setLoading(false); return }

    const { error: iscErr } = await supabase.from('iscrizioni').insert({
      lega_id: lega.id, utente_id: user.id,
      nome_squadra: nomeSquadra, budget_rimanente: lega.budget_iniziale,
    })

    if (iscErr) { setError('Errore: ' + iscErr.message); setLoading(false); return }
    router.push(`/leghe/${lega.id}`)
  }

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/leghe" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unisciti a una lega</h1>
          <p className="text-sm text-gray-500">Inserisci il codice invito ricevuto</p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Codice invito</label>
          <div className="flex gap-2">
            <input type="text" value={codice} onChange={e => setCodice(e.target.value.toUpperCase())}
              placeholder="es. BAR2026" maxLength={10}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
            <button onClick={cercaLega} disabled={loading || !codice.trim()}
              className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              <Search size={15} />{loading ? '...' : 'Cerca'}
            </button>
          </div>
        </div>

        {lega && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="font-semibold text-green-800">{lega.nome}</p>
              <p className="text-xs text-green-600 mt-1">
                Budget: {lega.budget_iniziale}M · Max {lega.max_partecipanti} partecipanti
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome della tua squadra</label>
              <input type="text" value={nomeSquadra} onChange={e => setNomeSquadra(e.target.value)}
                placeholder="es. Gli Invincibili" maxLength={30}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
            </div>
            <button onClick={handleJoin} disabled={loading || !nomeSquadra.trim()}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}Unisciti alla lega
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
