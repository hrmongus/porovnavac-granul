-- Fronta na doplnenie: neznáme zložky a krmivá, ktoré nie sú v databáze.
-- Prístup len cez service_role (Supabase dashboard, týždenný e-mail); anon/authenticated nič nevidia.

-- 1. Používateľ môže pri fotke/texte napísať, aké granule to sú (nepovinné).
alter table public.analyses
  add column if not exists product_hint text check (char_length(product_hint) <= 200);
comment on column public.analyses.product_hint is 'Nepovinné: značka a názov krmiva, ktoré používateľ zadal pri fotke alebo texte.';

-- 2. Neúspešné hľadania v zozname krmív (anonymne: len hľadaný text a čas).
create table if not exists public.search_misses (
  id          bigint generated always as identity primary key,
  query       text not null check (char_length(query) between 2 and 120),
  created_at  timestamptz not null default now()
);
alter table public.search_misses enable row level security;
revoke all on public.search_misses from anon, authenticated;
grant select, insert on public.search_misses to service_role;
-- žiadna policy pre anon/authenticated = žiadny prístup; zápis robí server cez service_role

-- 3. Neznáme zložky z analýz používateľov aj z databázy produktov (bez zátvoriek a dávok, ako alias).
--    Zložka zmizne z fronty sama, keď pre ňu pribudne alias (ingredient_aliases).
create or replace view public.na_doplnenie_zlozky
with (security_invoker = true) as
with vyskyty as (
  select trim(regexp_replace(regexp_replace(lower(u), '\([^)]*\)|\[[^\]]*\]', '', 'g'), '\d+([.,]\d+)?\s*(%|mg/kg|g/kg|mg|iu|ie|m\.j\.)', '', 'g')) as zlozka, a.created_at, coalesce(a.product_hint, left(a.input_raw, 80)) as priklad, 'analyza' as zdroj
  from public.analyses a, unnest(a.unknown_items) as u
  union all
  select trim(regexp_replace(regexp_replace(lower(pi.raw_text), '\([^)]*\)|\[[^\]]*\]', '', 'g'), '\d+([.,]\d+)?\s*(%|mg/kg|g/kg|mg|iu|ie|m\.j\.)', '', 'g')), p.updated_at, b.name || ' ' || p.name, 'databaza'
  from public.product_ingredients pi
  join public.products p on p.id = pi.product_id
  join public.brands b on b.id = p.brand_id
  where pi.ingredient_id is null
)
select v.zlozka,
       count(*)                                        as pocet,
       count(*) filter (where v.zdroj = 'analyza')     as z_analyz,
       max(v.created_at)                               as naposledy,
       (array_agg(v.priklad order by v.created_at desc))[1] as priklad
from vyskyty v
where not exists (select 1 from public.ingredient_aliases ia where ia.alias = v.zlozka)
group by v.zlozka
order by pocet desc, naposledy desc;

-- 4. Krmivá, ktoré ľudia analyzovali, ale nie sú v databáze (fotka/text) alebo ich nenašli v zozname.
create or replace view public.na_doplnenie_krmiva
with (security_invoker = true) as
select 'fotka/text' as typ,
       coalesce(nullif(trim(a.product_hint), ''), '(neuvedené)') as krmivo,
       count(*) as pocet,
       max(a.created_at) as naposledy,
       (array_agg(left(a.input_raw, 200) order by a.created_at desc))[1] as zlozenie_ukazka
from public.analyses a
where a.product_id is null and a.input_type in ('foto', 'text')
group by 2
union all
select 'nenájdené v zozname', lower(trim(s.query)), count(*), max(s.created_at), null
from public.search_misses s
group by lower(trim(s.query))
order by pocet desc, naposledy desc;

revoke all on public.na_doplnenie_zlozky, public.na_doplnenie_krmiva from anon, authenticated;
grant select on public.na_doplnenie_zlozky, public.na_doplnenie_krmiva to service_role;
