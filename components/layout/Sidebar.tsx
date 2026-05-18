'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Trophy, LayoutDashboard, Users, ShoppingCart, Shield, BarChart3, LogOut, Settings, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/types/database.types'

const nav = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/leghe',      label: 'Leghe',        icon: Users },
  { href: '/mercato',    label: 'Mercato',      icon: ShoppingCart },
  { href: '/squadra',    label: 'La mia rosa',  icon: Shield },
  { href: '/formazione', label: 'Formazione',   icon: Dumbbell },
  { href: '/classifica', label: 'Classifica',   icon: BarChart3 },
]

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex w-60 flex-col bg-white dark:bg-[#161b22] border-r border-gray-200 dark:border-gray-800 shrink-0">
      <div className="px-5 h-16 flex items-center border-b border-gray-100 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shadow-sm">
            <Trophy size={15} className="text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">FantaMondiale</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              active ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                     : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            )}>
              <Icon size={17} className={active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut size={17} />Esci
        </button>
        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 shrink-0">
            {profile?.username ? getInitials(profile.username) : '?'}
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
            {profile?.username ?? 'Utente'}
          </span>
        </div>
      </div>
    </aside>
  )
}
