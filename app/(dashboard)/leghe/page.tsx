import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus, Users, Lock, Globe, ArrowRight, Trophy } from 'lucide-react'
import Link from 'next/link'

export default async function LeghePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: iscrizioni } = await supabase
    .from('iscrizioni').select('*, leghe(*)').eq('utente_id', user.id)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leghe</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestisci le tue leghe o unisciti a una nuova</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leghe/join" className="inline-flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Unisciti
          </Link>
          <Link href="/leghe/crea" className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            <Plus size={15} />Crea lega
          </Link>
        </div>
      </div>

      {(!iscrizioni || iscrizioni.length === 0) ? (
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
          <Trophy size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Nessuna lega ancora</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">Crea la tua prima lega o unisciti a una con il codice invito</p>
          <div className="flex gap-3 justify-center">
            <Link href="/leghe/crea" className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">Crea lega</Link>
            <Link href="/leghe/join" className="border border-gray-200 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Inserisci codice</Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {iscrizioni.map((i: any) => (
            <Link key={i.id} href={`/leghe/${i.lega_id}`}
              className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:border-green-300 dark:hover:border-green-700 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Trophy size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{i.leghe?.nome}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      {i.leghe?.pubblica ? <><Globe size={10} />Pubblica</> : <><Lock size={10} />Privata</>}
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-green-500 transition-colors mt-1" />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1"><Users size={11} />{i.leghe?.max_partecipanti} max · Budget {i.leghe?.budget_iniziale}M</span>
                <span className="text-green-600 font-medium">{i.nome_squadra}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
