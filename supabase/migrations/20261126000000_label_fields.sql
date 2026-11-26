-- =====================================================================
-- Rozšírenie tabuľky products o celú etiketu krmiva
-- (analytické zložky, doplnkové látky, stopové prvky, energia)
-- a o pôvod dát. Spustiť po 20261119000000_init.sql.
-- =====================================================================

alter table public.products
  add column if not exists analytical_raw              text,  -- analytické zložky presne z etikety
  add column if not exists nutritional_additives_raw   text,  -- nutričné doplnkové látky (vitamíny, aminokyseliny…)
  add column if not exists trace_elements_raw          text,  -- stopové prvky (EÚ kódy 3b…: Zn, Fe, Cu, Mn, I, Se)
  add column if not exists technological_additives_raw text,  -- technologické doplnkové látky (antioxidanty, konzervanty)
  add column if not exists energy_raw                  text,  -- metabolizovateľná energia, ak je uvedená
  add column if not exists label_language              text check (label_language in ('sk','cs','en','other')),
  add column if not exists data_source                 text,  -- odkiaľ text etikety pochádza (e-shop / výrobca)
  add column if not exists missing_fields              text,  -- ktoré časti etikety zdroj neuvádza
  add column if not exists scraped_at                  timestamptz, -- kedy boli dáta naposledy stiahnuté
  add column if not exists notes                       text;

comment on column public.products.trace_elements_raw is
  'Stopové prvky = položky s EÚ kódom 3b (alebo starým E1–E8). Rozdelenie je rovnaké pre všetky značky.';
comment on column public.products.missing_fields is
  'Prázdne = etiketa je úplná. Inak zoznam častí, ktoré zdroj neuvádza.';
