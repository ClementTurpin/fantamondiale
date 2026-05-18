'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2, Shield, Calculator, RefreshCw, Settings, Users } from 'lucide-react'
import Link from 'next/link'

const MODULI = ['3-4-3','3-5-2','4-2-3-1','4-3-3','4-4-2','5-3-2','5-4-1']

type Imp = {
  num_portieri: number; num_difensori: number; num_centrocampisti: number
  num_attaccanti: number; num_panchina: number; rose_visibili: boolean
  moduli_consentiti: string[]; formazioni_nascoste: boolean; timeout_formazione: number
  bonus_gol_portiere: number; bonus_gol_difensore: number; bonus_gol_centrocampista: number
  bonus_gol_attaccante: number; bonus_assist: number; bonus_portiere_imbattuto: number
  malus_ammonizione: number; malus_espulsione: number; malus_gol_subito: number
  bonus_capitano: boolean; num_sostituzioni: number
}

const DEFAULT: Imp = {
  num_portieri:3,num_difensori:8,num_centrocampisti:8,num_attaccanti:6,num_panchina:7,
  rose_visibili:true,moduli_consentiti:['4-3-3','4-4-2','3-5-2'],
  formazioni_nascoste:false,timeout_formazione:0,
  bonus_gol_portiere:3,bonus_gol_difensore:2.5,bonus_gol_centrocampista:3,bonus_gol_attaccante:3,
  bonus_assist:1,bonus_portiere_imbattuto:1,malus_ammonizione:-0.5,malus_espulsione:-1,
  malus_gol_subito:-1,bonus_capitano:false,num_sostituzioni:3,
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function Num({ value, onChange, min, max, step=1 }: { value:number;onChange:(v:number)=>void;min:number;max:number;step?:number }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(min, Math.round((value-step)*10)/10))}
        className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-sm transition-colors">−</button>
      <span className="w-10 text-center font-semibold text-sm">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, Math.round((value+step)*10)/10))}
        className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-sm transition-colors">+</button>
    </div>
  )
}

function Sec({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-600">{icon}</div>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function ImpostazioniPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [imp, setImp] = useState<Imp>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [legaNome, setLegaNome] = useState('')

  const set = <K extends keyof Imp>(key: K, v: Imp[K]) => { setImp(p => ({...p,[key]:v})); setSaved(false) }

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: lega } = await supabase.from('leghe').select('*').eq('id', id).single()
      if (!lega || lega.admin_id !== user.id) { router.push(`/leghe/${id}`); return }
      setLegaNome(lega.nome)
      setImp({ num_portieri:lega.num_portieri??3, num_difensori:lega.num_difensori??8, num_centrocampisti:lega.num_centrocampisti??8, num_attaccanti:lega.num_attaccanti??6, num_panchina:lega.num_panchina??7, rose_visibili:lega.rose_visibili??true, moduli_consentiti:lega.moduli_consentiti??['4-3-3','4-4-2','3-5-2'], formazioni_nascoste:lega.formazioni_nascoste??false, timeout_formazione:lega.timeout_formazione??0, bonus_gol_portiere:lega.bonus_gol_portiere??3, bonus_gol_difensore:lega.bonus_gol_difensore??2.5, bonus_gol_centrocampista:lega.bonus_gol_centrocampista??3, bonus_gol_attaccante:lega.bonus_gol_attaccante??3, bonus_assist:lega.bonus_assist??1, bonus_portiere_imbattuto:lega.bonus_portiere_imbattuto??1, malus_ammonizione:lega.malus_ammonizione??-0.5, malus_espulsione:lega.malus_espulsione??-1, malus_gol_subito:lega.malus_gol_subito??-1, bonus_capitano:lega.bonus_capitano??false, num_sostituzioni:lega.num_sostituzioni??3 })
      setLoading(false)
    }
    load()
  }, [id])

  const handleSave = async () => {
    setSaving(true); setError(null)
    const { error } = await createClient().from('leghe').update(imp).eq('id', id)
    if (error) setError('Errore: ' + error.message)
    else setSaved(true)
    setSaving(false)
  }

  const toggleModulo = (m: string) => {
    const curr = imp.moduli_consentiti
    if (curr.includes(m)) { if (curr.length > 1) set('moduli_consentiti', curr.filter(x => x !== m)) }
    else set('moduli_consentiti', [...curr, m])
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-green-500" size={28} /></div>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/leghe/${id}`} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Impostazioni Lega</h1>
          <p className="text-sm text-gray-500">{legaNome}</p>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

      <Sec icon={<Users size={15} />} title="Configurazione Rosa">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Row label="Portieri" desc="Min 1, Max 5"><Num value={imp.num_portieri} onChange={v=>set('num_portieri',v)} min={1} max={5} /></Row>
          <Row label="Difensori" desc="Min 6, Max 15"><Num value={imp.num_difensori} onChange={v=>set('num_difensori',v)} min={6} max={15} /></Row>
          <Row label="Centrocampisti" desc="Min 6, Max 15"><Num value={imp.num_centrocampisti} onChange={v=>set('num_centrocampisti',v)} min={6} max={15} /></Row>
          <Row label="Attaccanti" desc="Min 4, Max 12"><Num value={imp.num_attaccanti} onChange={v=>set('num_attaccanti',v)} min={4} max={12} /></Row>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex justify-between text-sm">
          <span className="text-gray-500">Titolari totali</span>
          <span className="font-bold">{imp.num_portieri+imp.num_difensori+imp.num_centrocampisti+imp.num_attaccanti}</span>
        </div>
        <Row label="Panchina" desc="Max 20"><Num value={imp.num_panchina} onChange={v=>set('num_panchina',v)} min={0} max={20} /></Row>
        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/20 flex justify-between text-sm">
          <span className="text-green-700 font-medium">Rosa totale</span>
          <span className="font-bold text-green-700">{imp.num_portieri+imp.num_difensori+imp.num_centrocampisti+imp.num_attaccanti+imp.num_panchina} giocatori</span>
        </div>
        <Row label="Rose visibili" desc="Le rose sono visibili a tutti"><Toggle value={imp.rose_visibili} onChange={v=>set('rose_visibili',v)} /></Row>
      </Sec>

      <Sec icon={<Settings size={15} />} title="Formazioni">
        <div>
          <p className="text-sm font-medium mb-3">Moduli consentiti</p>
          <div className="flex flex-wrap gap-2">
            {MODULI.map(m => (
              <button key={m} type="button" onClick={() => toggleModulo(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${imp.moduli_consentiti.includes(m) ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 hover:border-green-400'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <Row label="Formazioni nascoste" desc="Nascoste fino al fischio d'inizio"><Toggle value={imp.formazioni_nascoste} onChange={v=>set('formazioni_nascoste',v)} /></Row>
        <Row label="Timeout inserimento (min)" desc="0 = nessun limite"><Num value={imp.timeout_formazione} onChange={v=>set('timeout_formazione',v)} min={0} max={60} /></Row>
      </Sec>

      <Sec icon={<RefreshCw size={15} />} title="Sostituzioni automatiche">
        <Row label="Numero massimo sostituzioni" desc="Giocatori che entrano dalla panchina automaticamente">
          <Num value={imp.num_sostituzioni} onChange={v=>set('num_sostituzioni',v)} min={0} max={7} />
        </Row>
      </Sec>

      <Sec icon={<Calculator size={15} />} title="Calcolo Punti">
        <p className="text-xs text-gray-400">I punti si sommano al voto base del giocatore</p>
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bonus Gol</p>
            <Row label="⚽ Gol Portiere"><div className="flex items-center gap-1"><span className="text-green-600 font-bold text-sm">+</span><Num value={imp.bonus_gol_portiere} onChange={v=>set('bonus_gol_portiere',v)} min={0} max={10} step={0.5} /></div></Row>
            <Row label="⚽ Gol Difensore"><div className="flex items-center gap-1"><span className="text-green-600 font-bold text-sm">+</span><Num value={imp.bonus_gol_difensore} onChange={v=>set('bonus_gol_difensore',v)} min={0} max={10} step={0.5} /></div></Row>
            <Row label="⚽ Gol Centrocampista"><div className="flex items-center gap-1"><span className="text-green-600 font-bold text-sm">+</span><Num value={imp.bonus_gol_centrocampista} onChange={v=>set('bonus_gol_centrocampista',v)} min={0} max={10} step={0.5} /></div></Row>
            <Row label="⚽ Gol Attaccante"><div className="flex items-center gap-1"><span className="text-green-600 font-bold text-sm">+</span><Num value={imp.bonus_gol_attaccante} onChange={v=>set('bonus_gol_attaccante',v)} min={0} max={10} step={0.5} /></div></Row>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bonus</p>
            <Row label="🎯 Assist"><div className="flex items-center gap-1"><span className="text-green-600 font-bold text-sm">+</span><Num value={imp.bonus_assist} onChange={v=>set('bonus_assist',v)} min={0} max={5} step={0.5} /></div></Row>
            <Row label="🧤 Porta inviolata (POR)"><div className="flex items-center gap-1"><span className="text-green-600 font-bold text-sm">+</span><Num value={imp.bonus_portiere_imbattuto} onChange={v=>set('bonus_portiere_imbattuto',v)} min={0} max={5} step={0.5} /></div></Row>
          </div>
          <div className="p-3 rounded-xl bg-red-50/50 dark:bg-red-950/10 space-y-3">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Malus</p>
            <Row label="🟨 Ammonizione"><div className="flex items-center gap-1"><span className="text-red-500 font-bold text-sm">−</span><Num value={Math.abs(imp.malus_ammonizione)} onChange={v=>set('malus_ammonizione',-v)} min={0} max={3} step={0.5} /></div></Row>
            <Row label="🟥 Espulsione"><div className="flex items-center gap-1"><span className="text-red-500 font-bold text-sm">−</span><Num value={Math.abs(imp.malus_espulsione)} onChange={v=>set('malus_espulsione',-v)} min={0} max={5} step={0.5} /></div></Row>
            <Row label="🥅 Gol subito (POR)"><div className="flex items-center gap-1"><span className="text-red-500 font-bold text-sm">−</span><Num value={Math.abs(imp.malus_gol_subito)} onChange={v=>set('malus_gol_subito',-v)} min={0} max={3} step={0.5} /></div></Row>
          </div>
        </div>
      </Sec>

      <Sec icon={<Shield size={15} />} title="Modificatori speciali">
        <Row label="👑 Bonus Capitano" desc="Il punteggio del capitano viene raddoppiato"><Toggle value={imp.bonus_capitano} onChange={v=>set('bonus_capitano',v)} /></Row>
      </Sec>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
        {saving ? <><Loader2 size={16} className="animate-spin" />Salvataggio...</> : saved ? <>✓ Salvato!</> : <><Save size={16} />Salva impostazioni</>}
      </button>
    </div>
  )
}
