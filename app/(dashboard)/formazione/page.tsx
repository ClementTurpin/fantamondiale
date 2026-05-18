import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Dumbbell } from 'lucide-react'
import Link from 'next/link'

export default async function FormazionePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Formazione</h1>
        <p className="text-sm text-gray-500 mt-0.5">Schiera i tuoi titolari per la giornata</p>
      </div>
      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-dashed border-gray-200 p-16 text-center">
        <Dumbbell size={40} className="text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 text-sm mb-2">Funzionalità in arrivo</p>
        <p className="text-xs text-gray-400 mb-6">Prima acquista i giocatori dal mercato</p>
        <Link href="/mercato" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">Vai al mercato</Link>
      </div>
    </div>
  )
}
