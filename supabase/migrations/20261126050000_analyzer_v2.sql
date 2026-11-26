-- =====================================================================
-- Analyzér 2.0: meno pri leade, údaje o psovi pri analýze,
-- anonymné neúspešné hľadania (len text a dátum).
-- =====================================================================
alter table public.leads
  add column if not exists name text check (length(name) <= 120);   -- meno človeka (okno pred výsledkom)

alter table public.analyses
  add column if not exists dog jsonb;  -- odpovede z dotazníka o psovi (meno, plemeno, vek, hmotnosť, zameranie…)

create table if not exists public.search_misses (
  id          bigint generated always as identity primary key,
  query       text not null check (length(query) between 1 and 200),
  created_at  timestamptz not null default now()
);
alter table public.search_misses enable row level security;
-- žiadna policy pre anon/authenticated = zápis aj čítanie len cez server (service_role)
revoke all on public.search_misses from anon, authenticated;
