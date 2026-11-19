-- =====================================================================
-- Analyzér zloženia granúl – databázová schéma (Supabase / Postgres)
-- Spustiť v Supabase: SQL Editor -> New query -> vložiť -> Run
-- =====================================================================

-- ---------- 1. Verzie metodiky (verejná, verzovaná) -------------------
create table public.methodology_versions (
  version       text primary key,              -- napr. '1.0'
  published_at  date not null default current_date,
  changelog     text,                          -- čo sa zmenilo
  rules         jsonb                          -- pravidlá skórovania
);

-- ---------- 2. Ingrediencie (srdce analyzéra) -------------------------
create table public.ingredients (
  id               bigint generated always as identity primary key,
  slug             text unique not null,       -- 'jahnacie-maso'
  name_sk          text not null,              -- 'Jahňacie mäso'
  category         text not null check (category in (
                     'maso','zivocisny_vedlajsi_produkt','obilnina','strukovina',
                     'zelenina_ovocie','tuk_olej','vlaknina','vitaminy_mineraly',
                     'prisada','ine')),
  classification   text not null check (classification in (
                     'pomenovana','nespecifikovana','spracovana')),
  sensitivity_flags text[] not null default '{}', -- {'kuracie','obilniny','strukoviny'}
  is_artificial_additive boolean not null default false, -- umelé farbivo/konzervant/aróma
  is_added_sugar   boolean not null default false,
  what_it_is       text,                       -- Čo to je (ľudská reč)
  why_used         text,                       -- Prečo to tam výrobca dáva
  watch_out        text,                       -- Na čo si dať pozor
  sources          jsonb not null default '[]', -- [{title, url}]
  methodology_version text references public.methodology_versions(version),
  updated_at       timestamptz not null default now()
);

-- Varianty názvov (SK/CZ/EN, preklepy, rôzne formulácie z etikiet)
create table public.ingredient_aliases (
  alias          text primary key check (alias = lower(alias)), -- vždy lowercase
  ingredient_id  bigint not null references public.ingredients(id) on delete cascade,
  language       text check (language in ('sk','cs','en','other'))
);

-- ---------- 3. Značky a produkty --------------------------------------
create table public.brands (
  id         bigint generated always as identity primary key,
  name       text unique not null,
  website    text,
  is_granula boolean not null default false    -- transparentne označená vlastná značka
);

create table public.products (
  id                 bigint generated always as identity primary key,
  brand_id           bigint not null references public.brands(id),
  name               text not null,
  slug               text unique not null,     -- pre SEO stránku produktu
  life_stage         text check (life_stage in ('stena','dospely','senior','vsetky')),
  main_protein       text,                     -- 'jahňa', 'losos'...
  grain_free         boolean,
  meat_percent       numeric(5,2) check (meat_percent between 0 and 100), -- deklarované % mäsa
  price_per_kg       numeric(8,2) check (price_per_kg >= 0),
  composition_raw    text not null,            -- zloženie presne z etikety
  composition_date   date,                     -- „zloženie k mesiac/rok“
  source_url         text,
  -- predpočítané skóre (podľa metodiky)
  score_transparency smallint check (score_transparency between 0 and 100),
  score_protein      smallint check (score_protein between 0 and 100),
  score_additives    smallint check (score_additives between 0 and 100),
  score_total        smallint check (score_total between 0 and 100),
  methodology_version text references public.methodology_versions(version),
  is_active          boolean not null default true, -- stiahnuté z trhu = false
  updated_at         timestamptz not null default now(),
  unique (brand_id, name)                      -- zároveň slúži ako index na brand_id
);

-- Rozpad zloženia na jednotlivé zložky
create table public.product_ingredients (
  product_id     bigint not null references public.products(id) on delete cascade,
  position       smallint not null check (position >= 1), -- poradie na etikete (1 = najviac)
  raw_text       text not null,                -- presne ako na etikete
  ingredient_id  bigint references public.ingredients(id), -- null = zatiaľ neznáma
  percent        numeric(5,2) check (percent between 0 and 100), -- ak je uvedené
  primary key (product_id, position)
);

-- ---------- 4. Leady (GDPR: súhlas sa ukladá aj s textom) -------------
create table public.leads (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique not null check (email = lower(email)), -- server ukladá lowercase
  dog_name           text,
  dog_breed          text,
  dog_age_years      numeric(4,1) check (dog_age_years >= 0),
  consent_marketing  boolean not null default false,
  consent_text       text not null,            -- presné znenie súhlasu
  consent_at         timestamptz not null default now(),
  source             text,                     -- utm / kanál
  created_at         timestamptz not null default now()
);

-- ---------- 5. Analýzy (každá má trvalý zdieľateľný odkaz = id) -------
create table public.analyses (
  id             uuid primary key default gen_random_uuid(),
  product_id     bigint references public.products(id) on delete set null, -- ak sa našiel v DB
  input_type     text not null check (input_type in ('foto','text','vyhladanie')),
  input_raw      text,                         -- vložený / rozpoznaný text
  result         jsonb not null,               -- skóre, zložky, benchmark
  unknown_items  text[] not null default '{}', -- zložky na doplnenie do DB
  lead_id        uuid references public.leads(id) on delete set null, -- GDPR výmaz leadu
  methodology_version text references public.methodology_versions(version),
  created_at     timestamptz not null default now()
);

-- ---------- 6. Nahlásenie chyby v zložení -----------------------------
create table public.error_reports (
  id          bigint generated always as identity primary key,
  product_id  bigint references public.products(id) on delete cascade,
  message     text not null check (length(message) between 1 and 2000),
  email       text check (length(email) <= 320),
  status      text not null default 'nove' check (status in ('nove','overuje_sa','opravene','zamietnute')),
  created_at  timestamptz not null default now()
);

-- ---------- 7. Pomocný pohľad: zložky, ktoré treba doplniť ------------
-- security_invoker: pohľad rešpektuje RLS a práva volajúceho
create view public.unknown_ingredients_queue
with (security_invoker = true) as
select lower(raw_text) as raw_text, count(*) as occurrences
from public.product_ingredients
where ingredient_id is null
group by lower(raw_text)
order by occurrences desc;

-- ---------- 8. Indexy --------------------------------------------------
-- products(brand_id) netreba – pokrýva ho unique (brand_id, name)
create index on public.products (score_total desc) where is_active;
create index on public.product_ingredients (ingredient_id);
create index on public.ingredient_aliases (ingredient_id);
create index on public.analyses (lead_id);
create index on public.analyses (product_id);
create index on public.error_reports (product_id);

-- ---------- 9. updated_at sa obnovuje automaticky ----------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger ingredients_updated_at before update on public.ingredients
for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

-- =====================================================================
-- Bezpečnosť (RLS)
-- Publishable key je verejný -> anon smie LEN čítať verejné dáta
-- a vložiť nahlásenie chyby. Leady a analýzy zapisuje iba server
-- (Edge Function so service_role kľúčom), nikdy priamo prehliadač.
-- =====================================================================
alter table public.methodology_versions enable row level security;
alter table public.ingredients          enable row level security;
alter table public.ingredient_aliases   enable row level security;
alter table public.brands               enable row level security;
alter table public.products             enable row level security;
alter table public.product_ingredients  enable row level security;
alter table public.leads                enable row level security;
alter table public.analyses             enable row level security;
alter table public.error_reports        enable row level security;

create policy "verejne citanie" on public.methodology_versions for select to anon, authenticated using (true);
create policy "verejne citanie" on public.ingredients          for select to anon, authenticated using (true);
create policy "verejne citanie" on public.ingredient_aliases   for select to anon, authenticated using (true);
create policy "verejne citanie" on public.brands               for select to anon, authenticated using (true);
create policy "verejne citanie" on public.products             for select to anon, authenticated using (is_active);
-- zloženie len aktívnych produktov (RLS na products sa uplatní aj v poddotaze)
create policy "verejne citanie" on public.product_ingredients  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
-- verejnosť smie vložiť len nové hlásenie, nie meniť stav
create policy "nahlasit chybu"  on public.error_reports        for insert to anon, authenticated
  with check (status = 'nove');
-- leads, analyses: žiadna anon policy = prístup len cez server

-- Explicitné práva (nespoliehať sa na default privileges projektu)
grant select on public.methodology_versions, public.ingredients, public.ingredient_aliases,
                public.brands, public.products, public.product_ingredients
  to anon, authenticated;
grant insert (product_id, message, email) on public.error_reports to anon, authenticated;

-- Pohľad nemá byť verejný
revoke all on public.unknown_ingredients_queue from anon, authenticated;

-- ---------- Prvá verzia metodiky ---------------------------------------
insert into public.methodology_versions (version, changelog)
values ('1.0', 'Prvá verzia metodiky.');
