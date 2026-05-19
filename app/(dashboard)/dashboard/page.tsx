import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Users, Target, TrendingUp, Plus, ArrowRight, ShoppingCart, Zap, Star, Globe } from 'lucide-react'
import Link from 'next/link'
import { formatBudget } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: iscrizioni }, { data: leghe }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('iscrizioni').select('*, leghe(*)').eq('utente_id', user.id),
    supabase.from('leghe').select('*').eq('admin_id', user.id),
  ])

  const { count } = await supabase.from('rosa').select('id', { count: 'exact' })
    .in('iscrizione_id', (iscrizioni ?? []).map(i => i.id))

  const stats = [
    { label: 'Leghe attive',      value: iscrizioni?.length ?? 0, icon: Users,      accent: '#38bdf8', glow: 'rgba(56,189,248,0.15)',  border: 'rgba(56,189,248,0.2)',  badge: 'LEGA' },
    { label: 'Giocatori in rosa', value: count ?? 0,               icon: Target,     accent: '#34d399', glow: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.2)',  badge: 'ROSA' },
    { label: 'Leghe create',      value: leghe?.length ?? 0,       icon: Trophy,     accent: '#f59e0b', glow: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.2)', badge: 'ADMIN' },
    { label: 'Giornata',          value: 1,                         icon: TrendingUp, accent: '#a78bfa', glow: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.2)', badge: 'LIVE' },
  ]

  const quickActions = [
    { href: '/mercato',    label: 'Mercato',    sub: 'Acquista giocatori', icon: ShoppingCart, accent: '#34d399' },
    { href: '/formazione', label: 'Formazione', sub: 'Schiera la squadra', icon: Zap,          accent: '#f59e0b' },
    { href: '/leghe/crea', label: 'Crea lega',  sub: 'Nuova competizione', icon: Plus,         accent: '#a78bfa' },
    { href: '/classifica', label: 'Classifica', sub: 'Vedi i punteggi',    icon: TrendingUp,   accent: '#f87171' },
  ]

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', letterSpacing: '0.15em', fontSize: '10px' }}>
              ⚡ STAGIONE 2026
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Bentornato, <span style={{ color: '#f59e0b' }}>{profile?.username ?? 'Campione'}</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Il Mondiale ti aspetta — costruisci la squadra perfetta
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/leghe/join"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Globe size={14} />
            Unisciti
          </Link>
          <Link href="/leghe/crea"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all text-black"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
            <Plus size={14} />
            Crea lega
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.border}`, boxShadow: `inset 0 1px 0 ${s.border}` }}>
            {/* Glow bg */}
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-30"
              style={{ background: s.glow, filter: 'blur(20px)' }} />
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: s.glow, border: `1px solid ${s.border}` }}>
                <s.icon size={16} style={{ color: s.accent }} />
              </div>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: s.glow, color: s.accent, fontSize: '9px', letterSpacing: '0.1em' }}>
                {s.badge}
              </span>
            </div>
            <p className="text-3xl font-black text-white">{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Leghe */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #f59e0b, #ef4444)' }} />
            <h2 className="font-black text-white tracking-tight">Le mie leghe</h2>
          </div>
          <Link href="/leghe"
            className="text-xs font-semibold flex items-center gap-1 transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            Vedi tutte <ArrowRight size={12} />
          </Link>
        </div>

        {(!iscrizioni || iscrizioni.length === 0) ? (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Trophy size={24} style={{ color: '#f59e0b' }} />
            </div>
            <p className="font-bold text-white mb-1">Nessuna lega ancora</p>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Crea una lega o unisciti con un codice invito
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/leghe/crea"
                className="text-sm font-bold px-5 py-2.5 rounded-xl text-black"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 4px 15px rgba(245,158,11,0.25)' }}>
                Crea una lega
              </Link>
              <Link href="/leghe/join"
                className="text-sm font-semibold px-5 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Unisciti con codice
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {iscrizioni.map((i: any) => (
              <Link key={i.id} href={`/leghe/${i.lega_id}`}
                className="rounded-2xl p-4 transition-all duration-200 group relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(245,158,11,0.3)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)'}>

                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
                      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.2))', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                      {(i.leghe?.nome ?? 'L').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{i.leghe?.nome ?? 'Lega'}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{i.nome_squadra}</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="mt-1 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'rgba(255,255,255,0.2)' }} />
                </div>

                {/* Budget bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Budget rimasto</span>
                    <span className="text-xs font-bold" style={{ color: '#34d399' }}>
                      {formatBudget(i.budget_rimanente ?? 0)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((i.budget_rimanente ?? 0) / (i.leghe?.budget_iniziale ?? 500)) * 100)}%`,
                        background: 'linear-gradient(90deg, #34d399, #059669)'
                      }} />
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <Users size={11} />{i.leghe?.max_partecipanti ?? '?'} partecipanti max
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', fontSize: '10px' }}>
                    ATTIVA
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #38bdf8, #7c3aed)' }} />
          <h2 className="font-black text-white tracking-tight">Azioni rapide</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href}
              className="rounded-2xl p-4 text-center transition-all duration-200 group relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.borderColor = `${a.accent}40`
                el.style.background = `${a.accent}08`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.background = 'rgba(255,255,255,0.03)'
              }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all"
                style={{ background: `${a.accent}15`, border: `1px solid ${a.accent}30` }}>
                <a.icon size={20} style={{ color: a.accent }} />
              </div>
              <p className="text-sm font-bold text-white">{a.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{a.sub}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* World cup banner */}
      <div className="rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(239,68,68,0.1) 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Star size={13} style={{ color: '#f59e0b' }} className="fill-amber-400" />
            <span className="text-xs font-bold tracking-widest" style={{ color: '#f59e0b', fontSize: '10px', letterSpacing: '0.2em' }}>FIFA WORLD CUP 2026</span>
          </div>
          <p className="font-black text-white text-lg">64 squadre · 48 gironi · 1 campione</p>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>USA · Canada · Messico — 11 giugno 2026</p>
        </div>
        <div className="relative text-5xl select-none">🏆</div>
      </div>
    </div>
  )
}
