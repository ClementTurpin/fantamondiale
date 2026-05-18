import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, ArrowLeft, Users, Settings } from 'lucide-react'
import Link from 'next/link'
import CopyButton from './CopyButton'

export default async function LegaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lega } = await supabase.from('leghe').select('*').eq('id', id).single()
  if (!lega) redirect('/leghe')

  const { data: iscrizioni } = await supabase
    .from('iscrizioni').select('*, profiles(username)').eq('lega_id', id)
    .order('punti_totali', { ascending: false })

  const isAdmin = lega.admin_id === user.id

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/leghe" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lega.nome}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{iscrizioni?.length ?? 0}/{lega.max_partecipanti} partecipanti · Budget {lega.budget_iniziale}M</p>
        </div>
        {isAdmin && (
          <Link href={`/leghe/${id}/impostazioni`}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Settings size={15} />Impostazioni
          </Link>
        )}
      </div>

      {/* Codice invito */}
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
        <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">🔗 Codice invito</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white dark:bg-gray-800 border border-green-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 dark:text-gray-200">
            {lega.codice_invito}
          </code>
          <CopyButton text={lega.codice_invito} />
        </div>
        <p className="text-xs text-green-600 mt-2">Gli amici possono unirsi da /leghe/join con questo codice</p>
      </div>

      {/* Classifica */}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" />Classifica
        </h2>
        <div className="space-y-2">
          {(!iscrizioni || iscrizioni.length === 0) ? (
            <div className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400">
              Nessun partecipante ancora
            </div>
          ) : iscrizioni.map((i: any, idx: number) => (
            <div key={i.id} className={`bg-white dark:bg-[#161b22] rounded-xl border p-4 flex items-center gap-4 ${i.utente_id === user.id ? 'border-green-200 bg-green-50/30' : 'border-gray-200 dark:border-gray-800'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'}`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900 dark:text-white">{i.nome_squadra}</p>
                <p className="text-xs text-gray-400">@{(i.profiles as any)?.username ?? 'utente'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">{i.punti_totali ?? 0} pt</p>
                <p className="text-xs text-gray-400">{i.budget_rimanente}M budget</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link mercato */}
      <Link href="/mercato"
        className="flex items-center justify-between bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-green-300 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <Users size={16} className="text-green-600" />
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900 dark:text-white">Vai al mercato</p>
            <p className="text-xs text-gray-400">Acquista i giocatori per la tua rosa</p>
          </div>
        </div>
        <ArrowLeft size={16} className="text-gray-300 group-hover:text-green-500 rotate-180 transition-colors" />
      </Link>
    </div>
  )
}
