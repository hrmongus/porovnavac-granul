-- =====================================================================
-- Ochrana proti spamu: záznam požiadaviek pre limit (zapisuje len server)
-- IP adresa sa neukladá – len jej jednosmerný hash.
-- =====================================================================
create table if not exists public.rate_limit_hits (
  id          bigint generated always as identity primary key,
  bucket      text not null,                 -- napr. 'analyza:<hash IP>'
  created_at  timestamptz not null default now()
);
create index if not exists rate_limit_hits_bucket_time on public.rate_limit_hits (bucket, created_at desc);

alter table public.rate_limit_hits enable row level security;
-- žiadna policy pre anon/authenticated = prístup len cez server (service_role)
revoke all on public.rate_limit_hits from anon, authenticated;

-- Staré záznamy (starší ako 1 deň) sa mažú pri každom zápise, tabuľka zostáva malá.
create or replace function public.rate_limit_prune() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.rate_limit_hits where created_at < now() - interval '1 day';
  return null;
end $$;
revoke all on function public.rate_limit_prune() from public, anon, authenticated;

drop trigger if exists rate_limit_prune on public.rate_limit_hits;
create trigger rate_limit_prune after insert on public.rate_limit_hits
for each statement execute function public.rate_limit_prune();
