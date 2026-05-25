export type Ruolo = 'POR' | 'DIF' | 'CEN' | 'ATT'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
  is_admin: boolean | null
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

export interface Asta {
  id: string
  lega_id: string
  giocatore_id: string
  venditore_iscrizione_id: string
  prezzo_base: number
  prezzo_attuale: number
  migliore_offerta_iscrizione_id: string | null
  scadenza_at: string
  stato: 'attiva' | 'chiusa' | 'annullata'
  created_at: string
}

export interface Offerta {
  id: string
  asta_id: string
  iscrizione_id: string
  importo: number
  created_at: string
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

// ── WC 2026 Rating Engine types ───────────────────────────

export type RoleFanta = 'P' | 'D' | 'C' | 'A'
export const ROLE_LABELS: Record<RoleFanta, string> = { P: 'Portiere', D: 'Difensore', C: 'Centrocampista', A: 'Attaccante' }
export const ROLE_COLORS: Record<RoleFanta, string> = {
  P: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  D: 'bg-blue-100 text-blue-800 border-blue-200',
  C: 'bg-green-100 text-green-800 border-green-200',
  A: 'bg-red-100 text-red-800 border-red-200',
}

export interface WcTeam {
  id: number
  name: string
  group_name: string | null
  flag_url: string | null
  fifa_ranking: number
  created_at: string
}

export interface WcPlayer {
  id: number
  name: string
  team_id: number | null
  role_fanta: RoleFanta | null
  jersey_number: number | null
  api_football_id: number | null
  role_override: boolean
  created_at: string
  wc_teams?: WcTeam
}

export interface WcMatch {
  id: number
  home_team_id: number | null
  away_team_id: number | null
  matchday: number
  phase: string
  status: 'NS' | 'LIVE' | 'FT' | 'PEN'
  played_at: string | null
  home_score: number | null
  away_score: number | null
  home_score_pens: number | null
  away_score_pens: number | null
  processed: boolean
  created_at: string
  home_team?: WcTeam
  away_team?: WcTeam
}

export interface PlayerMatchStats {
  id: string
  player_id: number
  match_id: number
  minutes: number
  goals: number
  assists: number
  shots_on: number
  shots_total: number
  passes_key: number
  passes_total: number
  passes_accuracy: number
  tackles: number
  duels_won: number
  duels_total: number
  dribbles_success: number
  fouls_committed: number
  fouls_drawn: number
  yellowcards: number
  redcards: number
  penalties_scored: number
  penalties_missed: number
  penalties_saved: number
  penalties_scored_shootout: number
  penalties_missed_shootout: number
  penalties_saved_shootout: number
  own_goals: number
  saves: number
  goals_conceded: number
  clean_sheet: boolean
  was_substituted: boolean
  entered_at_minute: number
  exited_at_minute: number
  data_quality: 'complete' | 'partial' | 'missing'
  created_at: string
  wc_players?: WcPlayer
}

export interface AlgorithmWeight {
  id: string
  role_fanta: RoleFanta
  stat_name: string
  weight: number
  locked: boolean
  updated_at: string
}

export interface Vote {
  id: string
  player_id: number
  match_id: number
  role_fanta: RoleFanta
  base_score: number
  final_vote: number | null
  is_sv: boolean
  details: {
    weights_contribution: Record<string, number>
    bonuses: Record<string, number>
    data_quality_warning?: boolean
  } | null
  override_by: string | null
  override_at: string | null
  created_at: string
  updated_at: string
  wc_players?: WcPlayer
}

export interface VoteJob {
  id: string
  match_id: number
  status: 'pending' | 'running' | 'done' | 'failed'
  result: { calculated: number; sv: number; skipped: number } | null
  created_at: string
  started_at: string | null
  finished_at: string | null
}
