import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3, Trophy } from 'lucide-react'
import Link from 'next/link'

export default async function ClassificaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: iscrizioni } = await supabase.from('iscrizioni')
    .select('*, leghe(nome), profiles(username)').eq('utente_id', user.id)

  if (!iscrizioni || iscrizioni.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classifica</h1>
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <BarChart3 size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-sm mb-4">Non sei in nessuna lega</p>
          <Link href="/leghe/crea" className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium">Crea una lega</Link>
        </div>
      </div>
    )
  }

  const legaId = iscrizioni[0].lega_id
  const { data: classifica } = await supabase.from('iscrizioni')
    .select('*, profiles(username)').eq('lega_id', legaId)
    .order('punti_totali', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classifica</h1>
        <p className="text-sm text-gray-500 mt-0.5">{iscrizioni[0].leghe?.nome}</p>
      </div>
      <div className="space-y-2">
        {classifica?.map((i: any, idx: number) => (
          <div key={i.id} className={`bg-white dark:bg-[#161b22] rounded-xl border p-4 flex items-center gap-4 ${i.utente_id === user.id ? 'border-green-200 bg-green-50/30' : 'border-gray-200 dark:border-gray-800'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'}`}>
              {idx === 0 ? <Trophy size={14} /> : idx + 1}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{i.nome_squadra}</p>
              <p className="text-xs text-gray-400">@{(i.profiles as any)?.username}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">{i.punti_totali ?? 0} pt</p>
              <p className="text-xs text-gray-400">{i.budget_rimanente}M</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
