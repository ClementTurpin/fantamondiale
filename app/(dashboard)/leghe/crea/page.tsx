'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Users, DollarSign, Lock, Globe, Trophy, Settings2 } from 'lucide-react'
import Link from 'next/link'

// Genera codice invito sempre in UPPERCASE
function generaCodiceInvito(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // niente 0/O e 1/I per evitare confusione
  let codice = ''
  for (let i = 0; i < 8; i++) {
    codice += chars[Math.floor(Math.random() * chars.length)]
  }
  return codice
}

export default function CreaLegaPage() {
  const [nome, setNome] = useState('')
  const [nomeSquadra, setNomeSquadra] = useState('')
  const [budget, setBudget] = useState(500)
  const [maxPartecipanti, setMaxPartecipanti] = useState(10)
  const [pubblica, setPubblica] = useState(false)
  
  // Nuove opzioni ispirate a Fantacalcio
  const [tipoCompetizione, setTipoCompetizione] = useState<'head_to_head' | 'all_vs_all'>('head_to_head')
  const [sogliaPunti, setSogliaPunti] = useState(66)
  const [bonusCapitano, setBonusCapitano] = useState(true)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Devi essere loggato'); setLoading(false); return }

    // ✅ Genera codice SEMPRE in uppercase lato client
    const codice_invito = generaCodiceInvito()

    const { data: lega, error: legaError } = await supabase
      .from('leghe')
      .insert({
        nome,
        admin_id: user.id,
        budget_iniziale: budget,
        max_partecipanti: maxPartecipanti,
        pubblica,
        codice_invito, // ✅ sempre uppercase, generato qui
        settings: {
          tipo_competizione: tipoCompetizione,
          soglia_punti: sogliaPunti,
          bonus_capitano: bonusCapitano,
          goal_interval: 6,
          home_bonus: 2,
          formazioni_nascoste: false,
          timeout_formazione_minuti: 5,
          max_sostituzioni: 5,
        }
      })
      .select()
      .single()

    if (legaError || !lega) {
      setError('Errore: ' + (legaError?.message ?? 'sconosciuto'))
      setLoading(false)
      return
    }

    const { error: iscErr } = await supabase.from('iscrizioni').insert({
      lega_id: lega.id,
      utente_id: user.id,
      nome_squadra: nomeSquadra,
      budget_rimanente: budget,
    })

    if (iscErr) { setError('Errore iscrizione: ' + iscErr.message); setLoading(false); return }
    router.push(`/leghe/${lega.id}`)
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/leghe" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crea una lega</h1>
          <p className="text-sm text-gray-500">Configura la tua lega e invita gli amici</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* SEZIONE 1 — Info lega */}
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy size={14} className="text-green-500" /> Lega
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome della lega</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} required maxLength={50}
              placeholder="es. Amici del Bar Sport"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Il nome della tua squadra</label>
            <input type="text" value={nomeSquadra} onChange={e => setNomeSquadra(e.target.value)} required maxLength={30}
              placeholder="es. Gli Invincibili"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visibilità</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: 'Privata', icon: Lock, desc: 'Solo su invito' },
                { value: true, label: 'Pubblica', icon: Globe, desc: 'Tutti possono entrare' },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button key={label} type="button" onClick={() => setPubblica(value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${pubblica === value ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 hover:border-gray-300'}`}>
                  <Icon size={16} className={pubblica === value ? 'text-green-600' : 'text-gray-400'} />
                  <div>
                    <p className={`text-sm font-medium ${pubblica === value ? 'text-green-700' : 'text-gray-700'}`}>{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SEZIONE 2 — Regolamento */}
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign size={14} className="text-blue-500" /> Regolamento
          </h2>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Budget iniziale</label>
              <span className="text-sm font-bold text-green-600">{budget}M</span>
            </div>
            <input type="range" min={100} max={1000} step={50} value={budget}
              onChange={e => setBudget(Number(e.target.value))} className="w-full accent-green-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>100M</span><span>1000M</span></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Users size={14} className="text-blue-500" /> Max partecipanti
              </label>
              <span className="text-sm font-bold text-blue-600">{maxPartecipanti}</span>
            </div>
            <input type="range" min={2} max={20} step={1} value={maxPartecipanti}
              onChange={e => setMaxPartecipanti(Number(e.target.value))} className="w-full accent-blue-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>2</span><span>20</span></div>
          </div>
        </div>

        {/* SEZIONE 3 — Competizione (nuovo!) */}
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Settings2 size={14} className="text-purple-500" /> Tipo di competizione
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'head_to_head', label: 'Scontri diretti', desc: '1 vs 1 ogni giornata' },
              { value: 'all_vs_all', label: 'Tutti vs tutti', desc: 'Classifica a punti' },
            ].map(({ value, label, desc }) => (
              <button key={value} type="button" onClick={() => setTipoCompetizione(value as any)}
                className={`p-3 rounded-xl border text-left transition-all ${tipoCompetizione === value ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className={`text-sm font-medium ${tipoCompetizione === value ? 'text-purple-700' : 'text-gray-700'}`}>{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          {/* Soglia punti */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Soglia per il primo gol</label>
              <span className="text-sm font-bold text-purple-600">{sogliaPunti} pt</span>
            </div>
            <input type="range" min={50} max={80} step={2} value={sogliaPunti}
              onChange={e => setSogliaPunti(Number(e.target.value))} className="w-full accent-purple-500" />
            <p className="text-xs text-gray-400 mt-1">Standard Fantacalcio: 66 punti</p>
          </div>

          {/* Bonus capitano */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Bonus capitano</p>
              <p className="text-xs text-gray-400">Il capitano vale doppio</p>
            </div>
            <button type="button" onClick={() => setBonusCapitano(!bonusCapitano)}
              className={`relative w-11 h-6 rounded-full transition-colors ${bonusCapitano ? 'bg-green-500' : 'bg-gray-200'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${bonusCapitano ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading || !nome.trim() || !nomeSquadra.trim()}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Crea lega
        </button>
      </form>
    </div>
  )
}
