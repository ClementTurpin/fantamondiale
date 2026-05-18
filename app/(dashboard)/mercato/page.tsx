import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MercatoClient from './MercatoClient'

export default async function MercatoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: giocatori }, { data: iscrizioni }] = await Promise.all([
    supabase.from('giocatori').select('*').eq('attivo', true).order('quotazione', { ascending: false }),
    supabase.from('iscrizioni').select('*, leghe(nome, budget_iniziale)').eq('utente_id', user.id),
  ])

  const { data: rosaPropria } = await supabase.from('rosa').select('giocatore_id, iscrizione_id')
    .in('iscrizione_id', (iscrizioni ?? []).map(i => i.id))

  return <MercatoClient giocatori={giocatori ?? []} iscrizioni={iscrizioni ?? []} rosaPropria={rosaPropria ?? []} />
}
