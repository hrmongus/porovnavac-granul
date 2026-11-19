-- Ukážkové dáta (voliteľné) – spusti po migrácii
insert into public.ingredients (slug, name_sk, category, classification, sensitivity_flags,
                                what_it_is, why_used, watch_out, methodology_version)
values
  ('jahnacie-maso', 'Jahňacie mäso', 'maso', 'pomenovana', '{}',
   'Mäso z jahniat, konkrétne pomenovaný zdroj bielkovín.',
   'Hlavný zdroj živočíšnych bielkovín.',
   'Sledujte, či je uvedené aj percento.', '1.0'),
  ('masove-mucky', 'Mäsové múčky', 'zivocisny_vedlajsi_produkt', 'nespecifikovana', '{}',
   'Sušené a zomleté živočíšne zvyšky bez uvedenia druhu zvieraťa.',
   'Lacný koncentrovaný zdroj bielkovín.',
   'Nevieme, z akého zvieraťa pochádzajú.', '1.0'),
  ('psenica', 'Pšenica', 'obilnina', 'pomenovana', '{obilniny}',
   'Obilnina, zdroj sacharidov.',
   'Lacný zdroj energie a pojivo granúl.',
   'Niektoré psy na ňu reagujú citlivo.', '1.0');

insert into public.ingredient_aliases (alias, ingredient_id, language) values
  ('jahňacie mäso', (select id from ingredients where slug='jahnacie-maso'), 'sk'),
  ('jehněčí maso',  (select id from ingredients where slug='jahnacie-maso'), 'cs'),
  ('lamb',          (select id from ingredients where slug='jahnacie-maso'), 'en'),
  ('mäsové múčky',  (select id from ingredients where slug='masove-mucky'), 'sk'),
  ('pšenica',       (select id from ingredients where slug='psenica'),       'sk'),
  ('pšenice',       (select id from ingredients where slug='psenica'),       'cs');

insert into public.brands (name, website) values ('Ukážková značka', 'https://example.com');

insert into public.products (brand_id, name, slug, life_stage, main_protein, grain_free,
                             meat_percent, price_per_kg, composition_raw, composition_date,
                             score_transparency, score_protein, score_additives, score_total,
                             methodology_version)
values ((select id from brands where name='Ukážková značka'), 'Adult Jahňa', 'ukazkova-adult-jahna',
        'dospely', 'jahňa', false, 30, 4.20,
        'Jahňacie mäso (30 %), pšenica, mäsové múčky, kukurica', '2026-11-01',
        60, 55, 80, 63, '1.0');

insert into public.product_ingredients (product_id, position, raw_text, ingredient_id, percent)
select p.id, v.position, v.raw_text, i.id, v.percent
from products p
cross join (values
  (1, 'Jahňacie mäso (30 %)', 'jahnacie-maso', 30.0),
  (2, 'pšenica',              'psenica',       null),
  (3, 'mäsové múčky',         'masove-mucky', null),
  (4, 'kukurica',             null,            null)  -- zatiaľ neznáma zložka
) as v(position, raw_text, slug, percent)
left join ingredients i on i.slug = v.slug
where p.slug = 'ukazkova-adult-jahna';
