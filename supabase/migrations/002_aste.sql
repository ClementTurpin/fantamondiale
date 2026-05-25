-- Aste (auctions) - private league only
create table if not exists public.aste (
  id uuid primary key default gen_random_uuid(),
  lega_id uuid references public.leghe(id) on delete cascade not null,
  giocatore_id uuid references public.giocatori(id) not null,
  venditore_iscrizione_id uuid references public.iscrizioni(id) not null,
  prezzo_base int not null default 1,
  prezzo_attuale int not null default 1,
  migliore_offerta_iscrizione_id uuid references public.iscrizioni(id),
  scadenza_at timestamptz not null,
  stato text not null default 'attiva' check (stato in ('attiva','chiusa','annullata')),
  created_at timestamptz default now(),
  unique(lega_id, giocatore_id, stato)
);

-- Offerte (bids)
create table if not exists public.offerte (
  id uuid primary key default gen_random_uuid(),
  asta_id uuid references public.aste(id) on delete cascade not null,
  iscrizione_id uuid references public.iscrizioni(id) not null,
  importo int not null,
  created_at timestamptz default now()
);

create index if not exists idx_aste_lega on public.aste(lega_id);
create index if not exists idx_aste_stato on public.aste(stato);
create index if not exists idx_offerte_asta on public.offerte(asta_id);

-- RLS
alter table public.aste enable row level security;
alter table public.offerte enable row level security;

create policy "aste_select" on public.aste for select
  using (lega_id in (select lega_id from public.iscrizioni where utente_id = auth.uid()));

create policy "aste_insert" on public.aste for insert
  with check (lega_id in (select lega_id from public.iscrizioni where utente_id = auth.uid()));

create policy "aste_update" on public.aste for update
  using (lega_id in (select lega_id from public.iscrizioni where utente_id = auth.uid()));

create policy "offerte_select" on public.offerte for select
  using (asta_id in (select id from public.aste where lega_id in (
    select lega_id from public.iscrizioni where utente_id = auth.uid())));

create policy "offerte_insert" on public.offerte for insert
  with check (iscrizione_id in (select id from public.iscrizioni where utente_id = auth.uid()));

-- Enable realtime for live bidding
alter publication supabase_realtime add table public.aste;
alter publication supabase_realtime add table public.offerte;
