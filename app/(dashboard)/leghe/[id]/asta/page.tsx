import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AstaListClient from './AstaListClient'

export default async function AstaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: legaId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lega } = await supabase.from('leghe').select('*').eq('id', legaId).single()
  if (!lega) redirect('/leghe')

  // Must be a member
  const { data: myIscrizione } = await supabase
    .from('iscrizioni').select('*').eq('lega_id', legaId).eq('utente_id', user.id).single()
  if (!myIscrizione) redirect(`/leghe/${legaId}`)

  // All members for names
  const { data: iscrizioni } = await supabase
    .from('iscrizioni').select('id, nome_squadra, budget_rimanente, utente_id').eq('lega_id', legaId)

  // Active auctions with player and seller info
  const { data: aste } = await supabase
    .from('aste')
    .select('*, giocatori(*), iscrizioni!venditore_iscrizione_id(nome_squadra)')
    .eq('lega_id', legaId)
    .eq('stato', 'attiva')
    .order('scadenza_at', { ascending: true })

  // My rosa (to know which players I can sell)
  const { data: myRosa } = await supabase
    .from('rosa')
    .select('*, giocatori(*)')
    .eq('iscrizione_id', myIscrizione.id)

  // Players already in any rosa in this league (sold = unavailable)
  const { data: allRosa } = await supabase
    .from('rosa')
    .select('giocatore_id')
    .in('iscrizione_id', (iscrizioni ?? []).map(i => i.id))

  const soldPlayerIds = new Set((allRosa ?? []).map(r => r.giocatore_id))
  // Also mark players already in active auctions
  const inAstaIds = new Set((aste ?? []).map(a => a.giocatore_id))

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/leghe/${legaId}`} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asta — {lega.nome}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Offerte in tempo reale · Budget rimanente: {myIscrizione.budget_rimanente}M</p>
        </div>
      </div>

      <AstaListClient
        legaId={legaId}
        myIscrizione={myIscrizione}
        iscrizioni={iscrizioni ?? []}
        initialAste={aste ?? []}
        myRosa={myRosa ?? []}
        soldPlayerIds={[...soldPlayerIds]}
        inAstaIds={[...inAstaIds]}
      />
    </div>
  )
}
