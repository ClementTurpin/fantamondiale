'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Trophy, LayoutDashboard, Users, ShoppingCart,
  Shield, BarChart3, LogOut, Swords, Star, Zap,
  CalendarDays, Globe, Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/types/database.types'

const nav = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard, color: 'text-sky-400' },
  { href: '/leghe',      label: 'Leghe',         icon: Swords,          color: 'text-amber-400' },
  { href: '/mercato',    label: 'Mercato',       icon: ShoppingCart,    color: 'text-emerald-400' },
  { href: '/squadra',    label: 'La mia rosa',   icon: Shield,          color: 'text-violet-400' },
  { href: '/formazione', label: 'Formazione',    icon: Zap,             color: 'text-orange-400' },
  { href: '/classifica', label: 'Classifica',    icon: BarChart3,       color: 'text-rose-400' },
]

const wcNav = [
  { href: '/matchday/1',  label: 'Giornate', icon: CalendarDays, color: 'text-cyan-400' },
  { href: '/standings/A', label: 'Gironi',   icon: Globe,        color: 'text-teal-400' },
]

const adminNav = [
  { href: '/admin',         label: 'Panoramica', icon: LayoutDashboard, color: 'text-amber-300' },
  { href: '/admin/import',  label: 'Importa',    icon: Globe,           color: 'text-amber-300' },
  { href: '/admin/weights', label: 'Pesi',       icon: Settings,        color: 'text-amber-300' },
  { href: '/admin/matches', label: 'Calcola',    icon: CalendarDays,    color: 'text-amber-300' },
  { href: '/admin/roles',   label: 'Ruoli',      icon: Shield,          color: 'text-amber-300' },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  const NavItem = ({ href, label, icon: Icon, color }: { href: string; label: string; icon: React.ElementType; color: string }) => {
    const active = isActive(href)
    return (
      <Link href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group',
          active ? 'text-white' : 'text-gray-500 hover:text-gray-200'
        )}
        style={active ? {
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
        } : { border: '1px solid transparent' }}>
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
            style={{ background: '#f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.6)' }} />
        )}
        <Icon size={17} className={active ? color : 'text-gray-600 group-hover:text-gray-400 transition-colors'} />
        <span>{label}</span>
        {!active && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.03)' }} />
        )}
      </Link>
    )
  }

  return (
    <aside className="hidden md:flex w-64 flex-col shrink-0 relative"
      style={{ background: 'linear-gradient(180deg, #0a0f1e 0%, #0d1526 60%, #0a1020 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Decorative top glow */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.4), transparent)' }} />

      {/* Logo */}
      <div className="px-5 h-16 flex items-center gap-3 relative"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="relative">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
            <Trophy size={17} className="text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
            style={{ borderColor: '#0a0f1e' }} />
        </div>
        <div>
          <span className="font-black text-sm tracking-wider text-white"
            style={{ fontFamily: 'system-ui', letterSpacing: '0.08em' }}>
            FANTA<span style={{ color: '#f59e0b' }}>MONDIALE</span>
          </span>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', fontSize: '9px', marginTop: '-1px' }}>
            WORLD CUP 2026
          </p>
        </div>
      </div>

      {/* User card */}
      <div className="mx-3 mt-4 mb-2 rounded-xl p-3 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white' }}>
            {profile?.username ? getInitials(profile.username) : '?'}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center"
            style={{ background: '#f59e0b' }}>
            <Star size={7} className="text-black fill-black" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{profile?.username ?? 'Campione'}</p>
          <p className="text-xs" style={{ color: '#f59e0b' }}>⚡ Fantallenatore</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-4 overflow-y-auto pb-2">
        {/* Main nav */}
        <div>
          <p className="px-2 pt-2 pb-1 text-xs font-bold tracking-widest"
            style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', letterSpacing: '0.2em' }}>
            NAVIGAZIONE
          </p>
          <div className="space-y-0.5">
            {nav.map(item => <NavItem key={item.href} {...item} />)}
          </div>
        </div>

        {/* WC section */}
        <div>
          <p className="px-2 pb-1 text-xs font-bold tracking-widest"
            style={{ color: 'rgba(56,189,248,0.5)', fontSize: '10px', letterSpacing: '0.2em' }}>
            MONDIALE 2026
          </p>
          <div className="space-y-0.5">
            {wcNav.map(item => <NavItem key={item.href} {...item} />)}
          </div>
        </div>

        {/* Admin section */}
        {profile?.is_admin && (
          <div>
            <p className="px-2 pb-1 text-xs font-bold tracking-widest"
              style={{ color: 'rgba(245,158,11,0.6)', fontSize: '10px', letterSpacing: '0.2em' }}>
              ADMIN
            </p>
            <div className="space-y-0.5">
              {adminNav.map(item => <NavItem key={item.href} {...item} />)}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-2 mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>STAGIONE 2026</span>
            <span className="text-xs font-bold" style={{ color: '#f59e0b', fontSize: '10px' }}>LV.1</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full w-1/4"
              style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)', boxShadow: '0 0 6px rgba(245,158,11,0.5)' }} />
          </div>
        </div>

        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
          style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid transparent' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.15)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
          }}>
          <LogOut size={16} />
          <span>Esci</span>
        </button>
      </div>
    </aside>
  )
}
