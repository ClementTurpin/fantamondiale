import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { getRuoloColor, formatBudget } from '@/lib/utils'
import type { Ruolo } from '@/lib/types/database.types'
import Link from 'next/link'

export default async function SquadraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: iscrizioni } = await supabase.from('iscrizioni').select('*, leghe(nome)').eq('utente_id', user.id)
  if (!iscrizioni || iscrizioni.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">La mia rosa</h1>
        <div className="bg-white rounded-2xl border border-dashed p-16 text-center">
          <Shield size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-sm mb-4">Non sei in nessuna lega ancora</p>
          <Link href="/leghe/crea" className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium">Crea una lega</Link>
        </div>
      </div>
    )
  }

  const isc = iscrizioni[0]
  const { data: rosa } = await supabase.from('rosa').select('*, giocatori(*)').eq('iscrizione_id', isc.id)
  const gruppi: Record<Ruolo, any[]> = { POR:[], DIF:[], CEN:[], ATT:[] }
  rosa?.forEach((r: any) => { if (r.giocatori) gruppi[r.giocatori.ruolo as Ruolo].push(r) })
  const labels: Record<Ruolo, string> = { POR:'Portieri', DIF:'Difensori', CEN:'Centrocampisti', ATT:'Attaccanti' }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">La mia rosa</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isc.leghe?.nome} · {isc.nome_squadra}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Budget rimasto</p>
          <p className="text-lg font-bold text-green-600">{formatBudget(isc.budget_rimanente)}</p>
        </div>
      </div>
      {!rosa || rosa.length === 0 ? (
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <Shield size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">Nessun giocatore in rosa</p>
          <Link href="/mercato" className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium">Vai al mercato</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {(['POR','DIF','CEN','ATT'] as Ruolo[]).map(r => {
            const g = gruppi[r]; if (!g.length) return null
            return (
              <div key={r}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${getRuoloColor(r)}`}>{r}</span>
                  <span className="text-sm font-medium text-gray-600">{labels[r]}</span>
                  <span className="text-xs text-gray-400">({g.length})</span>
                </div>
                <div className="space-y-2">
                  {g.map((item: any) => (
                    <div key={item.id} className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                        {item.giocatori?.cognome?.slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.giocatori?.nome} {item.giocatori?.cognome}</p>
                        <p className="text-xs text-gray-400">{item.giocatori?.nazionalita}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-600">{formatBudget(item.prezzo_acquisto)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
