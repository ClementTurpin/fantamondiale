export type Ruolo = 'POR' | 'DIF' | 'CEN' | 'ATT'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export interface Giocatore {
  id: string
  nome: string
  cognome: string
  ruolo: Ruolo
  nazionalita: string
  quotazione: number
  foto_url: string | null
  attivo: boolean
}

export interface Lega {
  id: string
  nome: string
  codice_invito: string
  admin_id: string
  budget_iniziale: number
  max_partecipanti: number
  pubblica: boolean
  created_at: string
  moduli_consentiti: string[]
  num_portieri: number
  num_difensori: number
  num_centrocampisti: number
  num_attaccanti: number
  num_panchina: number
  rose_visibili: boolean
  formazioni_nascoste: boolean
  timeout_formazione: number
  bonus_gol_portiere: number
  bonus_gol_difensore: number
  bonus_gol_centrocampista: number
  bonus_gol_attaccante: number
  bonus_assist: number
  bonus_portiere_imbattuto: number
  malus_ammonizione: number
  malus_espulsione: number
  malus_gol_subito: number
  bonus_capitano: boolean
  num_sostituzioni: number
}

export interface Iscrizione {
  id: string
  lega_id: string
  utente_id: string
  nome_squadra: string
  budget_rimanente: number
  punti_totali: number
  created_at: string
}

export interface Rosa {
  id: string
  iscrizione_id: string
  giocatore_id: string
  prezzo_acquisto: number
}

export interface Punteggio {
  id: string
  giocatore_id: string
  giornata: number
  gol: number
  assist: number
  ammonizioni: number
  espulsioni: number
  voto: number | null
  punti_fantasy: number | null
}
