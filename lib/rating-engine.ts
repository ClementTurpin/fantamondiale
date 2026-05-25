// ============================================================
// Milestone 2 — WC 2026 Rating Engine Core
// Spec: Fantamondiale2026_Prompt_v4.docx
// ============================================================

export type RoleFanta = 'P' | 'D' | 'C' | 'A'

export interface PlayerMatchStats {
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
}

export interface AlgorithmWeight {
  role_fanta: RoleFanta
  stat_name: string
  weight: number
}

export interface VoteDetails {
  weights_contribution: Record<string, number>
  bonuses: Record<string, number>
  data_quality_warning?: boolean
}

export interface VoteResult {
  player_id: number
  match_id: number
  role_fanta: RoleFanta
  base_score: number
  final_vote: number
  is_sv: boolean
  details: VoteDetails
}

// Stats that have direct weight application (value * weight)
// passes_accuracy is special: (value - 70) * weight
const STAT_NAMES = [
  'saves', 'goals_conceded', 'tackles', 'duels_won', 'passes_key',
  'passes_accuracy', 'dribbles_success', 'shots_on', 'shots_total',
] as const

// "Relevant event" for the 12-minute rule
function hasRelevantEvent(stats: PlayerMatchStats, role: RoleFanta): boolean {
  return (
    stats.goals > 0 ||
    stats.assists > 0 ||
    stats.yellowcards > 0 ||
    stats.redcards > 0 ||
    stats.penalties_scored > 0 ||
    stats.penalties_missed > 0 ||
    stats.own_goals > 0 ||
    (role === 'P' && stats.saves > 0)
  )
}

export function calculateVote(
  stats: PlayerMatchStats,
  role: RoleFanta,
  weights: AlgorithmWeight[],
  matchStatus: string,  // 'FT' | 'PEN' | 'NS' | 'LIVE' | ...
): VoteResult {
  const isPenShootout = matchStatus === 'PEN'
  const roleWeights = weights.filter(w => w.role_fanta === role)

  // ── 12-minute rule ─────────────────────────────────────────
  if (stats.minutes < 12) {
    if (!hasRelevantEvent(stats, role)) {
      return {
        player_id: stats.player_id,
        match_id: stats.match_id,
        role_fanta: role,
        base_score: 0,
        final_vote: 0,
        is_sv: true,
        details: { weights_contribution: {}, bonuses: {} },
      }
    }

    // P or D on pitch < 12 min with goals conceded → simplified formula
    if ((role === 'P' || role === 'D') && stats.goals_conceded > 0) {
      const gcW = roleWeights.find(w => w.stat_name === 'goals_conceded')?.weight ?? 0
      const vote = 6.0 + stats.goals_conceded * gcW
      return {
        player_id: stats.player_id,
        match_id: stats.match_id,
        role_fanta: role,
        base_score: 6.0,
        final_vote: vote,
        is_sv: false,
        details: {
          weights_contribution: { goals_conceded: stats.goals_conceded * gcW },
          bonuses: {},
          ...(stats.data_quality === 'partial' ? { data_quality_warning: true } : {}),
        },
      }
    }
  }

  // ── Base score from weights ────────────────────────────────
  let score = 6.0
  const weightContribs: Record<string, number> = {}

  for (const w of roleWeights) {
    // clean_sheet and penalties_saved are handled separately
    if (w.stat_name === 'clean_sheet' || w.stat_name === 'penalties_saved') continue

    let rawValue: number
    if (w.stat_name === 'passes_accuracy') {
      // Special formula: (accuracy - 70) * weight
      rawValue = (stats.passes_accuracy ?? 0) - 70
    } else {
      rawValue = (stats as unknown as Record<string, number>)[w.stat_name] ?? 0
    }

    const contrib = rawValue * w.weight
    weightContribs[w.stat_name] = contrib
    score += contrib
  }

  // ── Clean sheet bonus ──────────────────────────────────────
  const csWeight = roleWeights.find(w => w.stat_name === 'clean_sheet')?.weight ?? 0
  if (csWeight > 0 && stats.clean_sheet) {
    let eligible = false
    if (role === 'P') {
      // GK: ≥60 min, no goals conceded while on pitch (clean_sheet already reflects this)
      eligible = stats.minutes >= 60
    } else if (role === 'D') {
      // DEF: ≥60 min, started (entered_at_minute === 0), no goals conceded
      // Substitute defenders are NEVER eligible
      eligible = stats.minutes >= 60 && stats.entered_at_minute === 0
    }
    if (eligible) {
      weightContribs['clean_sheet'] = csWeight
      score += csWeight
    }
  }

  // ── Direct bonuses & malus ─────────────────────────────────
  const bonuses: Record<string, number> = {}

  bonuses['goals']   = stats.goals   * 3.0
  bonuses['assists'] = stats.assists * 1.0

  if (stats.yellowcards > 0) bonuses['yellowcards'] = stats.yellowcards * -0.5
  if (stats.redcards    > 0) bonuses['redcards']    = stats.redcards    * -2.0
  if (stats.own_goals   > 0) bonuses['own_goals']   = stats.own_goals   * -2.0

  // Regular penalty malus (does NOT apply for shootout kicks)
  if (stats.penalties_missed > 0) bonuses['penalties_missed'] = stats.penalties_missed * -3.0

  // GK: regular penalty save bonus
  if (role === 'P' && stats.penalties_saved > 0) {
    const psW = roleWeights.find(w => w.stat_name === 'penalties_saved')?.weight ?? 3.0
    bonuses['penalties_saved'] = stats.penalties_saved * psW
  }

  // ── Penalty shootout modifiers (only when status = 'PEN') ──
  if (isPenShootout) {
    if (stats.penalties_scored_shootout > 0)
      bonuses['penalties_scored_shootout'] = stats.penalties_scored_shootout * 0.5
    if (stats.penalties_missed_shootout > 0)
      bonuses['penalties_missed_shootout'] = stats.penalties_missed_shootout * -1.0
    if (role === 'P' && stats.penalties_saved_shootout > 0)
      bonuses['penalties_saved_shootout'] = stats.penalties_saved_shootout * 1.5
  }

  const totalBonuses = Object.values(bonuses).reduce((s, v) => s + v, 0)
  score += totalBonuses

  return {
    player_id: stats.player_id,
    match_id: stats.match_id,
    role_fanta: role,
    base_score: 6.0,
    final_vote: score,
    is_sv: false,
    details: {
      weights_contribution: weightContribs,
      bonuses,
      ...(stats.data_quality === 'partial' ? { data_quality_warning: true } : {}),
    },
  }
}

// ── Simulation helpers ────────────────────────────────────────
export type SimScenario =
  | 'standard'
  | 'goal_fest'
  | 'clean_sheet'
  | 'red_card'
  | 'penalty_drama'
  | 'early_sub'
  | 'underdog_win'
  | 'goalkeeper_hero'
  | 'injury_early_exit'
  | 'penalty_shootout'

const BASE_STATS: PlayerMatchStats = {
  player_id: 1, match_id: 1,
  minutes: 90, goals: 0, assists: 0,
  shots_on: 1, shots_total: 2, passes_key: 1,
  passes_total: 40, passes_accuracy: 80,
  tackles: 2, duels_won: 3, duels_total: 5,
  dribbles_success: 1, fouls_committed: 1, fouls_drawn: 1,
  yellowcards: 0, redcards: 0,
  penalties_scored: 0, penalties_missed: 0, penalties_saved: 0,
  penalties_scored_shootout: 0, penalties_missed_shootout: 0, penalties_saved_shootout: 0,
  own_goals: 0, saves: 0, goals_conceded: 0,
  clean_sheet: true, was_substituted: false, entered_at_minute: 0, exited_at_minute: 90,
  data_quality: 'complete',
}

export function buildSimStats(scenario: SimScenario): { stats: PlayerMatchStats; role: RoleFanta; matchStatus: string } {
  switch (scenario) {
    case 'goalkeeper_hero':
      return {
        stats: { ...BASE_STATS, saves: 8, goals_conceded: 0, clean_sheet: true, passes_accuracy: 75 },
        role: 'P', matchStatus: 'FT',
      }
    case 'goal_fest':
      return {
        stats: { ...BASE_STATS, goals: 2, assists: 1, shots_on: 4, shots_total: 6, clean_sheet: false },
        role: 'A', matchStatus: 'FT',
      }
    case 'clean_sheet':
      return {
        stats: { ...BASE_STATS, tackles: 5, duels_won: 6, passes_key: 2, passes_accuracy: 82, clean_sheet: true },
        role: 'D', matchStatus: 'FT',
      }
    case 'red_card':
      return {
        stats: { ...BASE_STATS, redcards: 1, minutes: 30, clean_sheet: false },
        role: 'D', matchStatus: 'FT',
      }
    case 'penalty_drama':
      return {
        stats: { ...BASE_STATS, penalties_missed: 1, shots_on: 2 },
        role: 'A', matchStatus: 'FT',
      }
    case 'early_sub':
      return {
        stats: { ...BASE_STATS, minutes: 8, was_substituted: true, exited_at_minute: 8 },
        role: 'D', matchStatus: 'FT',
      }
    case 'injury_early_exit':
      return {
        stats: { ...BASE_STATS, minutes: 22, was_substituted: true, exited_at_minute: 22 },
        role: 'C', matchStatus: 'FT',
      }
    case 'underdog_win':
      return {
        stats: { ...BASE_STATS, tackles: 7, duels_won: 9, passes_accuracy: 65, clean_sheet: false, goals_conceded: 1 },
        role: 'D', matchStatus: 'FT',
      }
    case 'penalty_shootout':
      return {
        stats: {
          ...BASE_STATS,
          saves: 3, goals_conceded: 0, clean_sheet: true,
          penalties_saved_shootout: 3, penalties_missed_shootout: 0,
          penalties_scored_shootout: 0,
        },
        role: 'P', matchStatus: 'PEN',
      }
    default: // standard
      return {
        stats: { ...BASE_STATS, passes_key: 2, shots_on: 2, duels_won: 4 },
        role: 'C', matchStatus: 'FT',
      }
  }
}
