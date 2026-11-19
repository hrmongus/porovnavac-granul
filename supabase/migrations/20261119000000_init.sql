-- Porovnávač granúl – počiatočná schéma
-- Spusti v Supabase: Dashboard → SQL Editor → New query → vlož celý súbor → Run

-- ============ ENUMY ============
create type animal_type as enum ('pes', 'macka');
create type life_stage  as enum ('steňa_mačiatko', 'dospely', 'senior', 'vsetky');
create type dog_size    as enum ('mini', 'maly', 'stredny', 'velky', 'obri', 'vsetky');

-- ============ ZNAČKY ============
create table public.brands (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  country     text,
  website     text,
  created_at  timestamptz not null default now()
);

-- ============ GRANULE (produkty) ============
create table public.products (
  id              bigint generated always as identity primary key,
  brand_id        bigint not null references public.brands(id) on delete cascade,
  name            text not null,
  slug            text not null unique,
  animal          animal_type not null,
  life_stage      life_stage not null default 'dospely',
  dog_size        dog_size,                       -- len pre psov
  grain_free      boolean not null default false,
  main_protein    text,                           -- napr. 'kura', 'losos', 'jahňa'
  -- analytické zložky v %
  protein_pct     numeric(5,2) check (protein_pct  between 0 and 100),
  fat_pct         numeric(5,2) check (fat_pct      between 0 and 100),
  fiber_pct       numeric(5,2) check (fiber_pct    between 0 and 100),
  ash_pct         numeric(5,2) check (ash_pct      between 0 and 100),
  moisture_pct    numeric(5,2) check (moisture_pct between 0 and 100),
  meat_pct        numeric(5,2) check (meat_pct     between 0 and 100),
  energy_kcal_kg  integer check (energy_kcal_kg > 0),
  ingredients     text,                           -- zloženie ako na obale
  image_url       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (brand_id, name)
);
create index products_brand_idx  on public.products(brand_id);
create index products_animal_idx on public.products(animal, life_stage);

-- ============ OBCHODY ============
create table public.shops (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  website     text,
  created_at  timestamptz not null default now()
);

-- ============ CENY (balenie v konkrétnom obchode) ============
create table public.prices (
  id           bigint generated always as identity primary key,
  product_id   bigint not null references public.products(id) on delete cascade,
  shop_id      bigint not null references public.shops(id) on delete cascade,
  weight_kg    numeric(6,2) not null check (weight_kg > 0),
  price_eur    numeric(8,2) not null check (price_eur >= 0),
  price_per_kg numeric(8,2) generated always as (round(price_eur / weight_kg, 2)) stored,
  url          text,
  in_stock     boolean not null default true,
  checked_at   timestamptz not null default now(),
  unique (product_id, shop_id, weight_kg)
);
create index prices_product_idx on public.prices(product_id);

-- ============ updated_at trigger ============
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

-- ============ POHĽAD PRE POROVNÁVAČ ============
-- Každý produkt s najnižšou cenou za kg a prepočtom bielkovín na sušinu
create or replace view public.product_comparison
with (security_invoker = true) as
select
  p.id, p.slug, p.name, b.name as brand, p.animal, p.life_stage, p.dog_size,
  p.grain_free, p.main_protein,
  p.protein_pct, p.fat_pct, p.fiber_pct, p.ash_pct, p.moisture_pct, p.meat_pct,
  p.energy_kcal_kg,
  case when p.moisture_pct is not null and p.moisture_pct < 100
       then round(p.protein_pct * 100 / (100 - p.moisture_pct), 2) end as protein_dm_pct,
  min(pr.price_per_kg) filter (where pr.in_stock) as min_price_per_kg,
  p.image_url
from public.products p
join public.brands b on b.id = p.brand_id
left join public.prices pr on pr.product_id = p.id
group by p.id, b.name;

-- ============ RLS: verejné čítanie, zápis len cez dashboard / service_role ============
alter table public.brands   enable row level security;
alter table public.products enable row level security;
alter table public.shops    enable row level security;
alter table public.prices   enable row level security;

create policy "public read" on public.brands   for select to anon, authenticated using (true);
create policy "public read" on public.products for select to anon, authenticated using (true);
create policy "public read" on public.shops    for select to anon, authenticated using (true);
create policy "public read" on public.prices   for select to anon, authenticated using (true);

grant select on public.product_comparison to anon, authenticated;
