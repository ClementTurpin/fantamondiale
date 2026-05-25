-- ============================================================
-- Milestone 1 — WC 2026 Rating Engine: Data Layer
-- ============================================================

-- Add admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ── National teams (API-Football integer IDs) ──────────────
CREATE TABLE IF NOT EXISTS wc_teams (
  id            INT PRIMARY KEY,
  name          TEXT NOT NULL,
  group_name    TEXT,
  flag_url      TEXT,
  fifa_ranking  INT NOT NULL DEFAULT 999,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── World Cup players ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS wc_players (
  id               INT PRIMARY KEY,
  name             TEXT NOT NULL,
  team_id          INT REFERENCES wc_teams(id),
  role_fanta       TEXT CHECK (role_fanta IN ('P','D','C','A')),
  jersey_number    INT,
  api_football_id  INT UNIQUE,
  role_override    BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wc_players_team ON wc_players(team_id);

-- Role change audit log (spec: log every change with timestamp + reason)
CREATE TABLE IF NOT EXISTS wc_player_role_changes (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id    INT NOT NULL REFERENCES wc_players(id),
  old_role     TEXT,
  new_role     TEXT NOT NULL,
  reason       TEXT,
  changed_by   UUID REFERENCES auth.users(id),
  changed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Matches ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wc_matches (
  id                  INT PRIMARY KEY,
  home_team_id        INT REFERENCES wc_teams(id),
  away_team_id        INT REFERENCES wc_teams(id),
  matchday            INT NOT NULL,
  phase               TEXT DEFAULT 'group',  -- group, r16, qf, sf, final
  status              TEXT DEFAULT 'NS',     -- NS, LIVE, FT, PEN
  played_at           TIMESTAMPTZ,
  home_score          INT DEFAULT NULL,
  away_score          INT DEFAULT NULL,
  home_score_pens     INT DEFAULT NULL,
  away_score_pens     INT DEFAULT NULL,
  processed           BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wc_matches_phase     ON wc_matches(phase);
CREATE INDEX IF NOT EXISTS idx_wc_matches_processed ON wc_matches(processed);

-- ── Per-match player stats ─────────────────────────────────
CREATE TABLE IF NOT EXISTS player_match_stats (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id                   INT NOT NULL REFERENCES wc_players(id),
  match_id                    INT NOT NULL REFERENCES wc_matches(id),
  minutes                     INT DEFAULT 0,
  goals                       INT DEFAULT 0,
  assists                     INT DEFAULT 0,
  shots_on                    INT DEFAULT 0,
  shots_total                 INT DEFAULT 0,
  passes_key                  INT DEFAULT 0,
  passes_total                INT DEFAULT 0,
  passes_accuracy             INT DEFAULT 0,
  tackles                     INT DEFAULT 0,
  duels_won                   INT DEFAULT 0,
  duels_total                 INT DEFAULT 0,
  dribbles_success            INT DEFAULT 0,
  fouls_committed             INT DEFAULT 0,
  fouls_drawn                 INT DEFAULT 0,
  yellowcards                 INT DEFAULT 0,
  redcards                    INT DEFAULT 0,
  penalties_scored            INT DEFAULT 0,
  penalties_missed            INT DEFAULT 0,
  penalties_saved             INT DEFAULT 0,
  penalties_scored_shootout   INT DEFAULT 0,
  penalties_missed_shootout   INT DEFAULT 0,
  penalties_saved_shootout    INT DEFAULT 0,
  own_goals                   INT DEFAULT 0,
  saves                       INT DEFAULT 0,
  goals_conceded              INT DEFAULT 0,
  clean_sheet                 BOOLEAN DEFAULT FALSE,
  was_substituted             BOOLEAN DEFAULT FALSE,
  entered_at_minute           INT DEFAULT 0,
  exited_at_minute            INT DEFAULT 90,
  data_quality                TEXT DEFAULT 'complete' CHECK (data_quality IN ('complete','partial','missing')),
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_pms_match  ON player_match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_pms_player ON player_match_stats(player_id);

-- ── Algorithm weights (editable by admin, locked before tournament) ──
CREATE TABLE IF NOT EXISTS algorithm_weights (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_fanta  TEXT NOT NULL CHECK (role_fanta IN ('P','D','C','A')),
  stat_name   TEXT NOT NULL,
  weight      DECIMAL(8,4) NOT NULL,
  locked      BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_fanta, stat_name)
);

-- ── Role averages (for live projections) ──────────────────
CREATE TABLE IF NOT EXISTS role_averages (
  role_fanta            TEXT PRIMARY KEY CHECK (role_fanta IN ('P','D','C','A')),
  avg_minutes           DECIMAL(5,2) DEFAULT 75,
  avg_tackles           DECIMAL(5,2) DEFAULT 1.5,
  avg_passes_key        DECIMAL(5,2) DEFAULT 1.2,
  avg_shots_on          DECIMAL(5,2) DEFAULT 0.5,
  avg_duels_won         DECIMAL(5,2) DEFAULT 3.0,
  avg_dribbles_success  DECIMAL(5,2) DEFAULT 0.8,
  avg_saves             DECIMAL(5,2) DEFAULT 0.0,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Calculated votes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id   INT NOT NULL REFERENCES wc_players(id),
  match_id    INT NOT NULL REFERENCES wc_matches(id),
  role_fanta  TEXT NOT NULL CHECK (role_fanta IN ('P','D','C','A')),
  base_score  DECIMAL(4,2) DEFAULT 6.0,
  final_vote  DECIMAL(5,3),
  is_sv       BOOLEAN DEFAULT FALSE,
  details     JSONB,
  override_by UUID REFERENCES auth.users(id),
  override_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_match  ON votes(match_id);
CREATE INDEX IF NOT EXISTS idx_votes_player ON votes(player_id);

-- ── Vote job queue ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vote_jobs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id    INT NOT NULL REFERENCES wc_matches(id),
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed')),
  result      JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- ── Updated-at trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER votes_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER weights_updated_at
  BEFORE UPDATE ON algorithm_weights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE wc_teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_players           ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_matches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_stats   ENABLE ROW LEVEL SECURITY;
ALTER TABLE algorithm_weights    ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_averages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_jobs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_player_role_changes ENABLE ROW LEVEL SECURITY;

-- Public read for all authenticated users
CREATE POLICY "auth read wc_teams"   ON wc_teams           FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read wc_players" ON wc_players         FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read wc_matches" ON wc_matches         FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read pms"        ON player_match_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read weights"    ON algorithm_weights  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read averages"   ON role_averages      FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read votes"      ON votes              FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read role_changes" ON wc_player_role_changes FOR SELECT TO authenticated USING (true);

-- Admin write (service role bypasses RLS; admin UI uses service key via API route)

-- ── Appendix B: Default algorithm weights (seed) ──────────
INSERT INTO algorithm_weights (role_fanta, stat_name, weight) VALUES
  ('P', 'saves',            0.18),
  ('P', 'goals_conceded',  -0.80),
  ('P', 'penalties_saved',  3.00),
  ('P', 'clean_sheet',      1.20),
  ('P', 'passes_accuracy',  0.01),
  ('D', 'tackles',          0.10),
  ('D', 'duels_won',        0.06),
  ('D', 'passes_key',       0.14),
  ('D', 'passes_accuracy',  0.01),
  ('D', 'goals_conceded',  -0.40),
  ('D', 'clean_sheet',      0.60),
  ('D', 'dribbles_success', 0.08),
  ('C', 'passes_key',       0.16),
  ('C', 'passes_accuracy',  0.01),
  ('C', 'tackles',          0.06),
  ('C', 'shots_on',         0.18),
  ('C', 'dribbles_success', 0.10),
  ('C', 'duels_won',        0.05),
  ('A', 'shots_on',         0.14),
  ('A', 'shots_total',      0.04),
  ('A', 'dribbles_success', 0.10),
  ('A', 'passes_key',       0.13),
  ('A', 'duels_won',        0.04)
ON CONFLICT (role_fanta, stat_name) DO NOTHING;

-- ── Role averages seed ─────────────────────────────────────
INSERT INTO role_averages (role_fanta, avg_minutes, avg_tackles, avg_passes_key, avg_shots_on, avg_duels_won, avg_dribbles_success, avg_saves) VALUES
  ('P', 90, 0.5, 1.0, 0.0, 1.0, 0.2, 3.5),
  ('D', 75, 2.5, 1.0, 0.5, 4.0, 0.8, 0.0),
  ('C', 72, 2.0, 1.8, 0.8, 4.5, 1.2, 0.0),
  ('A', 68, 0.8, 1.2, 1.8, 3.5, 1.5, 0.0)
ON CONFLICT (role_fanta) DO NOTHING;
