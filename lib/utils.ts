import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Ruolo } from '@/lib/types/database.types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBudget(amount: number): string {
  return `${amount}M`
}

export function getRuoloColor(ruolo: Ruolo): string {
  const colors: Record<Ruolo, string> = {
    POR: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    DIF: 'bg-blue-100 text-blue-800 border-blue-200',
    CEN: 'bg-green-100 text-green-800 border-green-200',
    ATT: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[ruolo]
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function calcolaPuntiFantasy({
  voto, gol, assist, ammonizioni, espulsioni, ruolo,
  bonusGol, bonusAssist, bonusPorInviol, malusAmm, malusEsp, malusGolSubito, golSubiti,
}: {
  voto: number; gol: number; assist: number; ammonizioni: number; espulsioni: number
  ruolo: Ruolo; bonusGol: number; bonusAssist: number; bonusPorInviol: number
  malusAmm: number; malusEsp: number; malusGolSubito: number; golSubiti?: number
}): number {
  let punti = voto
  punti += gol * bonusGol
  punti += assist * bonusAssist
  punti -= ammonizioni * Math.abs(malusAmm)
  punti -= espulsioni * Math.abs(malusEsp)
  if (ruolo === 'POR') {
    if (golSubiti === 0) punti += bonusPorInviol
    if (golSubiti) punti -= golSubiti * Math.abs(malusGolSubito)
  }
  return Math.round(punti * 10) / 10
}
