'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Users, DollarSign, Lock, Globe } from 'lucide-react'
import Link from 'next/link'

export default function CreaLegaPage() {
  const [nome, setNome] = useState('')
  const [nomeSquadra, setNomeSquadra] = useState('')
  const [budget, setBudget] = useState(500)
  const [maxPartecipanti, setMaxPartecipanti] = useState(10)
  const [pubblica, setPubblica] = useState(false)
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

    const { data: lega, error: legaError } = await supabase
      .from('leghe').insert({ nome, admin_id: user.id, budget_iniziale: budget, max_partecipanti: maxPartecipanti, pubblica })
      .select().single()

    if (legaError || !lega) { setError('Errore: ' + (legaError?.message ?? '')); setLoading(false); return }

    const { error: iscErr } = await supabase.from('iscrizioni')
      .insert({ lega_id: lega.id, utente_id: user.id, nome_squadra: nomeSquadra, budget_rimanente: budget })

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

      {error && <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <h2 className="font-semibold text-sm">Lega</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome della lega</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} required maxLength={50} placeholder="es. Amici del Bar Sport"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Il nome della tua squadra</label>
            <input type="text" value={nomeSquadra} onChange={e => setNomeSquadra(e.target.value)} required maxLength={30} placeholder="es. Gli Invincibili"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibilità</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: 'Privata',  icon: Lock,  desc: 'Solo su invito' },
                { value: true,  label: 'Pubblica', icon: Globe, desc: 'Tutti possono entrare' },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button key={label} type="button" onClick={() => setPubblica(value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${pubblica === value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
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

        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <h2 className="font-semibold text-sm">Regolamento</h2>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><DollarSign size={14} className="text-green-500" />Budget iniziale</label>
              <span className="text-sm font-bold text-green-600">{budget}M</span>
            </div>
            <input type="range" min={100} max={1000} step={50} value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full accent-green-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>100M</span><span>1000M</span></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Users size={14} className="text-blue-500" />Max partecipanti</label>
              <span className="text-sm font-bold text-blue-600">{maxPartecipanti}</span>
            </div>
            <input type="range" min={2} max={20} step={1} value={maxPartecipanti} onChange={e => setMaxPartecipanti(Number(e.target.value))} className="w-full accent-blue-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>2</span><span>20</span></div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin" />}Crea lega
        </button>
      </form>
    </div>
  )
}
