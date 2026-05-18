-- ============================================
-- FantaMondiale - Schema Completo
-- ============================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.giocatori (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cognome text not null,
  ruolo text not null check (ruolo in ('POR','DIF','CEN','ATT')),
  nazionalita text not null,
  quotazione int not null default 1,
  foto_url text,
  attivo boolean default true
);

create table if not exists public.leghe (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codice_invito text unique not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  admin_id uuid references public.profiles(id) on delete set null,
  budget_iniziale int not null default 500,
  max_partecipanti int not null default 10,
  pubblica boolean not null default false,
  created_at timestamptz default now(),
  -- Impostazioni rosa
  moduli_consentiti text[] default '{"4-3-3","4-4-2","3-5-2","4-2-3-1","3-4-3"}',
  num_portieri int default 3,
  num_difensori int default 8,
  num_centrocampisti int default 8,
  num_attaccanti int default 6,
  num_panchina int default 7,
  rose_visibili boolean default true,
  formazioni_nascoste boolean default false,
  timeout_formazione int default 0,
  -- Impostazioni calcolo
  bonus_gol_portiere numeric default 3,
  bonus_gol_difensore numeric default 2.5,
  bonus_gol_centrocampista numeric default 3,
  bonus_gol_attaccante numeric default 3,
  bonus_assist numeric default 1,
  bonus_portiere_imbattuto numeric default 1,
  malus_ammonizione numeric default -0.5,
  malus_espulsione numeric default -1,
  malus_gol_subito numeric default -1,
  bonus_capitano boolean default false,
  num_sostituzioni int default 3
);

create table if not exists public.iscrizioni (
  id uuid primary key default gen_random_uuid(),
  lega_id uuid references public.leghe(id) on delete cascade not null,
  utente_id uuid references public.profiles(id) on delete cascade not null,
  nome_squadra text not null,
  budget_rimanente int,
  punti_totali numeric default 0,
  created_at timestamptz default now(),
  unique(lega_id, utente_id)
);

create table if not exists public.rosa (
  id uuid primary key default gen_random_uuid(),
  iscrizione_id uuid references public.iscrizioni(id) on delete cascade not null,
  giocatore_id uuid references public.giocatori(id) not null,
  prezzo_acquisto int not null,
  created_at timestamptz default now(),
  unique(iscrizione_id, giocatore_id)
);

create table if not exists public.formazioni (
  id uuid primary key default gen_random_uuid(),
  iscrizione_id uuid references public.iscrizioni(id) on delete cascade not null,
  giornata int not null,
  modulo text not null default '4-3-3',
  unique(iscrizione_id, giornata)
);

create table if not exists public.formazione_titolari (
  formazione_id uuid references public.formazioni(id) on delete cascade not null,
  giocatore_id uuid references public.giocatori(id) not null,
  posizione int not null check (posizione between 1 and 11),
  e_capitano boolean default false,
  primary key (formazione_id, posizione)
);

create table if not exists public.punteggi (
  id uuid primary key default gen_random_uuid(),
  giocatore_id uuid references public.giocatori(id) not null,
  giornata int not null,
  gol int not null default 0,
  assist int not null default 0,
  ammonizioni int not null default 0,
  espulsioni int not null default 0,
  gol_subiti int not null default 0,
  voto numeric(3,1),
  punti_fantasy numeric(4,1),
  unique(giocatore_id, giornata)
);

create table if not exists public.scontri (
  id uuid primary key default gen_random_uuid(),
  lega_id uuid references public.leghe(id) on delete cascade not null,
  giornata int not null,
  squadra_casa uuid references public.iscrizioni(id) not null,
  squadra_ospite uuid references public.iscrizioni(id) not null,
  punti_casa numeric(5,1) not null default 0,
  punti_ospite numeric(5,1) not null default 0,
  giocata boolean not null default false
);

-- Indici
create index if not exists idx_iscrizioni_utente on public.iscrizioni(utente_id);
create index if not exists idx_iscrizioni_lega on public.iscrizioni(lega_id);
create index if not exists idx_rosa_iscrizione on public.rosa(iscrizione_id);
create index if not exists idx_punteggi_giocatore on public.punteggi(giocatore_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.giocatori enable row level security;
alter table public.leghe enable row level security;
alter table public.iscrizioni enable row level security;
alter table public.rosa enable row level security;
alter table public.formazioni enable row level security;
alter table public.punteggi enable row level security;
alter table public.scontri enable row level security;

-- Drop vecchie policy
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "giocatori_select_all" on public.giocatori;
drop policy if exists "leghe_select" on public.leghe;
drop policy if exists "leghe_insert" on public.leghe;
drop policy if exists "leghe_update_admin" on public.leghe;
drop policy if exists "iscrizioni_select_own" on public.iscrizioni;
drop policy if exists "iscrizioni_insert_own" on public.iscrizioni;
drop policy if exists "iscrizioni_update_own" on public.iscrizioni;
drop policy if exists "iscrizioni_delete_own" on public.iscrizioni;
drop policy if exists "rosa_select" on public.rosa;
drop policy if exists "rosa_insert_own" on public.rosa;
drop policy if exists "punteggi_select" on public.punteggi;
drop policy if exists "scontri_select" on public.scontri;

-- Nuove policy
create policy "profiles_own" on public.profiles for all using (auth.uid() = id);
create policy "giocatori_read" on public.giocatori for select using (auth.role() = 'authenticated');
create policy "leghe_read" on public.leghe for select using (pubblica = true or admin_id = auth.uid() or id in (select lega_id from public.iscrizioni where utente_id = auth.uid()));
create policy "leghe_insert" on public.leghe for insert with check (admin_id = auth.uid());
create policy "leghe_update" on public.leghe for update using (admin_id = auth.uid());
create policy "iscrizioni_select" on public.iscrizioni for select using (utente_id = auth.uid() or lega_id in (select lega_id from public.iscrizioni where utente_id = auth.uid()));
create policy "iscrizioni_insert" on public.iscrizioni for insert with check (utente_id = auth.uid());
create policy "iscrizioni_update" on public.iscrizioni for update using (utente_id = auth.uid());
create policy "rosa_select" on public.rosa for select using (iscrizione_id in (select id from public.iscrizioni where utente_id = auth.uid()));
create policy "rosa_insert" on public.rosa for insert with check (iscrizione_id in (select id from public.iscrizioni where utente_id = auth.uid()));
create policy "rosa_delete" on public.rosa for delete using (iscrizione_id in (select id from public.iscrizioni where utente_id = auth.uid()));
create policy "punteggi_read" on public.punteggi for select using (auth.role() = 'authenticated');
create policy "scontri_read" on public.scontri for select using (lega_id in (select lega_id from public.iscrizioni where utente_id = auth.uid()));

-- Trigger profilo auto-creazione
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure handle_new_user();
