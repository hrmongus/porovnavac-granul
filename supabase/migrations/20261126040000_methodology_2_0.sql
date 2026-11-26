-- Metodika 2.0: skóre zo štyroch ukazovateľov + uloženie ukazovateľov pri produkte.

alter table public.products
  add column if not exists score_quality      smallint check (score_quality between 0 and 100),     -- kvalita surovín
  add column if not exists score_meat         smallint check (score_meat between 0 and 100),        -- body za mäso
  add column if not exists score_processing   smallint check (score_processing between 0 and 100),  -- body za spracovanosť
  add column if not exists meat_percent_est   smallint check (meat_percent_est between 0 and 100),  -- odhad % mäsa v hotových granulách
  add column if not exists processed_percent  smallint check (processed_percent between 0 and 100), -- váhový podiel spracovaných surovín
  add column if not exists carbs_percent_est  numeric(4,1);                                          -- odhad sacharidov (len informácia)

comment on column public.products.score_transparency is 'Metodika 2.0: transparentnosť 0–100 (pomenované zložky v top 10, percentá pri top 3).';
comment on column public.products.meat_percent_est is 'Odhad % mäsa v hotových granulách z deklarovaných percent; null = výrobca neuvádza.';
comment on column public.products.carbs_percent_est is 'Odhad sacharidov (NBE) z analytických zložiek; nehodnotí sa.';

insert into public.methodology_versions (version, published_at, changelog, rules) values (
  '2.0', date '2026-11-26',
  'Skóre = 55 % kvalita surovín + 20 % mäso v hotových granulách + 10 % spracovanosť + 15 % transparentnosť; stropy 49 a 69 ostávajú. '
  'Sušené bielkoviny a proteín zo zvierat sa hodnotia ako múčka (40, bez druhu 30). Hydrolyzované bielkoviny 55 (bez druhu 40). '
  'Rastlinné proteíny 50, múka zo strukovín 55, hrach, šošovica, cícer 60, pomenované rastlinné oleje 70. Sacharidy sa nehodnotia.',
  '{
    "parts": {"quality": 0.55, "meat": 0.20, "processing": 0.10, "transparency": 0.15},
    "quality": {"position_weights": [30,20,15,10,8], "rest_weight": 17},
    "meat": {"full_at_percent": 50, "undeclared_points": 30, "fresh_dry_matter": 0.25, "other_dry_matter": 0.9,
             "counts": "len pomenované mäso a vnútornosti (čerstvé, sušené); nie múčka, bielkoviny, hydrolyzáty"},
    "processing": {"points": "100 - 2 × váhový podiel spracovaných surovín (%)",
                   "processed": "múčky, sušené a hydrolyzované bielkoviny, rastlinné proteíny a frakcie, lepok, škroby, celulóza, nešpecifikované vedľajšie produkty, cukor, glycerín"},
    "transparency": {"named_top10": 0.6, "percent_top3": 0.4},
    "bands": {"zelena": [90,100], "zlta": [70,89], "oranzova": [50,69], "cervena": [0,49]},
    "caps": [
      {"if": "cervena zlozka medzi prvymi 5", "max": 49},
      {"if": "farbiva | synteticke konzervanty | cukor kdekolvek", "max": 69}
    ],
    "verdicts": {"90": "Výborné zloženie", "70": "Kvalitné zloženie", "50": "Slabšia kvalita zloženia", "0": "Nekvalitné zloženie"},
    "carbs_scored": false,
    "additives_scored": false
  }'::jsonb
) on conflict (version) do nothing;
