import Link from 'next/link'
import { Trophy, Users, Zap, BarChart3, ArrowRight, Shield, Globe } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117]">
      <nav className="border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">FantaMondiale</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors">Accedi</Link>
            <Link href="/register" className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">Inizia gratis</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Mondiale 2026 — 64 squadre nazionali
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.05] mb-6">
              Il Fantacalcio<br /><span className="text-green-500">del Mondiale</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-xl leading-relaxed">
              Crea la tua fantasquadra con i giocatori del Mondiale, sfida gli amici nelle leghe private e scala le classifiche in tempo reale.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all hover:shadow-lg hover:shadow-green-500/25 active:scale-[0.98]">
                Crea la tua squadra <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-base transition-all hover:border-gray-300">
                Ho già un account
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-1.5"><Shield size={14} className="text-green-500" />Gratuito</div>
              <div className="flex items-center gap-1.5"><Users size={14} className="text-green-500" />Leghe private</div>
              <div className="flex items-center gap-1.5"><Zap size={14} className="text-green-500" />Punteggi live</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Tutto quello che ti serve</h2>
          <p className="text-gray-500 text-lg">Un'esperienza fantasy completa, pensata per il Mondiale</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: <Globe size={20} />, title: '64 squadre nazionali', desc: 'Tutti i giocatori del Mondiale con statistiche aggiornate.' },
            { icon: <Users size={20} />, title: 'Leghe private', desc: 'Crea la tua lega, invita gli amici con un link.' },
            { icon: <Trophy size={20} />, title: 'Mercato & Budget', desc: '500 crediti per costruire la rosa perfetta.' },
            { icon: <BarChart3 size={20} />, title: 'Classifiche live', desc: 'Punteggi calcolati in automatico dopo ogni partita.' },
            { icon: <Zap size={20} />, title: 'Scontri diretti', desc: 'Calendario con match 1v1. Ogni giornata un avversario.' },
            { icon: <Shield size={20} />, title: 'Formazione tattica', desc: 'Scegli modulo, titolari, panchina e capitano.' },
          ].map((f, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/50 hover:border-green-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center mb-4 text-green-500">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="bg-green-500 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto a sfidare i tuoi amici?</h2>
          <p className="text-green-100 mb-8 text-lg">Crea la tua lega in 2 minuti e invita chiunque con un link.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-green-600 px-8 py-3.5 rounded-xl font-bold hover:bg-green-50 transition-colors">
            Inizia ora — è gratis <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2"><Trophy size={14} className="text-green-500" /><span>FantaMondiale 2026</span></div>
        </div>
      </footer>
    </div>
  )
}
