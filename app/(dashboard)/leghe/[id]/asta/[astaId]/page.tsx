import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AstaBidClient from './AstaBidClient'

export default async function AstaDetailPage({ params }: { params: Promise<{ id: string; astaId: string }> }) {
  const { id: legaId, astaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myIscrizione } = await supabase
    .from('iscrizioni').select('*').eq('lega_id', legaId).eq('utente_id', user.id).single()
  if (!myIscrizione) redirect(`/leghe/${legaId}`)

  const { data: asta } = await supabase
    .from('aste')
    .select('*, giocatori(*), iscrizioni!venditore_iscrizione_id(nome_squadra, utente_id)')
    .eq('id', astaId)
    .single()
  if (!asta) redirect(`/leghe/${legaId}/asta`)

  // All members
  const { data: iscrizioni } = await supabase
    .from('iscrizioni').select('id, nome_squadra, budget_rimanente, utente_id').eq('lega_id', legaId)

  // Bid history
  const { data: offerte } = await supabase
    .from('offerte')
    .select('*, iscrizioni(nome_squadra)')
    .eq('asta_id', astaId)
    .order('created_at', { ascending: false })

  // Player stats if available
  const { data: stats } = await supabase
    .from('punteggi')
    .select('*')
    .eq('giocatore_id', asta.giocatore_id)
    .order('giornata', { ascending: false })
    .limit(5)

  const isSeller = asta.venditore_iscrizione_id === myIscrizione.id

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/leghe/${legaId}/asta`} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {asta.giocatori.nome} {asta.giocatori.cognome}
        </h1>
      </div>

      <AstaBidClient
        asta={asta}
        myIscrizione={myIscrizione}
        iscrizioni={iscrizioni ?? []}
        initialOfferte={offerte ?? []}
        initialStats={stats ?? []}
        isSeller={isSeller}
        legaId={legaId}
      />
    </div>
  )
}
