'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, ShoppingCart, Shield, BarChart3, Trophy } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/types/database.types'

const nav = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Home' },
  { href: '/leghe',      icon: Users,            label: 'Leghe' },
  { href: '/mercato',    icon: ShoppingCart,     label: 'Mercato' },
  { href: '/squadra',    icon: Shield,           label: 'Rosa' },
  { href: '/classifica', icon: BarChart3,        label: 'Classifica' },
]

export default function MobileNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  return (
    <>
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-gray-800 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
            <Trophy size={13} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">FantaMondiale</span>
        </Link>
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
          {profile?.username ? getInitials(profile.username) : '?'}
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#161b22] border-t border-gray-200 dark:border-gray-800 flex">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
              active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
            )}>
              <Icon size={20} />{label}
            </Link>
          )
        })}
      </nav>
      <div className="md:hidden h-16" />
    </>
  )
}
