-- Ukážkové dáta (voliteľné) – spusti po migrácii
insert into public.brands (name, country) values
  ('Ukážková značka A', 'SK'),
  ('Ukážková značka B', 'CZ');

insert into public.shops (name, website) values
  ('Obchod 1', 'https://example.com'),
  ('Obchod 2', 'https://example.org');

insert into public.products
  (brand_id, name, slug, animal, life_stage, dog_size, grain_free, main_protein,
   protein_pct, fat_pct, fiber_pct, ash_pct, moisture_pct, meat_pct, energy_kcal_kg)
values
  ((select id from brands where name='Ukážková značka A'), 'Adult Kura', 'a-adult-kura',
   'pes', 'dospely', 'stredny', false, 'kura', 26, 15, 2.5, 7, 9, 50, 3800),
  ((select id from brands where name='Ukážková značka B'), 'Cat Losos GF', 'b-cat-losos-gf',
   'macka', 'dospely', null, true, 'losos', 34, 18, 2, 8, 8, 70, 4000);

insert into public.prices (product_id, shop_id, weight_kg, price_eur) values
  ((select id from products where slug='a-adult-kura'),   (select id from shops where name='Obchod 1'), 12, 44.90),
  ((select id from products where slug='a-adult-kura'),   (select id from shops where name='Obchod 2'), 3,  14.50),
  ((select id from products where slug='b-cat-losos-gf'), (select id from shops where name='Obchod 1'), 2,  18.90);
