# Porovnávač granúl

Analyzér zloženia granúl pre psov – rozpad zloženia na zložky, vysvetlenia a skóre podľa verejnej metodiky.

## Databáza (Supabase)

Projekt: `https://mqgukyfttafavlnlaoyj.supabase.co`

1. Supabase Dashboard → **SQL Editor** → New query
2. Vlož a spusti `supabase/migrations/20261119000000_init.sql`
3. Spusti `supabase/migrations/20261126000000_label_fields.sql` (stĺpce pre celú etiketu)
4. Spusti postupne `supabase/data/granule_2026-11-19_cast1.sql`, `_cast2.sql`, `_cast3.sql`
   (granule zo slovenského trhu; dajú sa spúšťať aj opakovane)
5. Spusti `supabase/migrations/20261126010000_ingredient_scores.sql`
6. Spusti `supabase/migrations/20261126040000_methodology_2_0.sql` (pridá metodiku 2.0 – súbor Granuly na ňu odkazuje)
7. Spusti `supabase/data/granula_produkty_2026-11-26.sql` (receptúry Granula) a potom `supabase/data/zlozky_a_skore_v2.sql`
   (227 zložiek, 3 511 zápisov, skóre a ukazovatele 1 784 produktov podľa metodiky 2.0)
8. `supabase/seed.sql` s ukážkovými dátami už netreba
9. Skopíruj `.env.example` do `.env`

### Nasadenie do produkcie
Jediná vetva je `main` a každý push do nej automaticky aplikuje nové migrácie
zo `supabase/migrations/` do produkčnej databázy (GitHub Actions → `deploy-supabase.yml`).

Jednorazové nastavenie: GitHub → Settings → Secrets and variables → Actions → secret
`SUPABASE_DB_URL` = connection string zo Supabase (Connect → **Session pooler**, s heslom DB).

### Tabuľky
- `methodology_versions` – verejná, verzovaná metodika skórovania
- `ingredients` + `ingredient_aliases` – databáza zložiek a ich variantov názvov (SK/CZ/EN)
- `brands`, `products` – značky a granule s predpočítaným skóre
- `product_ingredients` – rozpad zloženia z etikety na zložky (`ingredient_id` null = neznáma)
- `leads`, `analyses` – e-maily so súhlasom (GDPR) a uložené analýzy; zapisuje **len server**
- `error_reports` – verejné nahlásenie chyby v zložení
- pohľad `unknown_ingredients_queue` – neznáme zložky na doplnenie (neverejný)

RLS: verejnosť (publishable key) smie čítať metodiku, zložky, značky a **aktívne** produkty
a vložiť nové hlásenie chyby. `leads` a `analyses` zapisuje iba Edge Function so `service_role` kľúčom.

### Použitie v JS
```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY)
const { data } = await supabase
  .from('products')
  .select('slug, name, score_total, brands(name)')
  .order('score_total', { ascending: false })
```

## Dáta o granulách (`supabase/data/`)

Zber 2026-11-19: **1 779 receptúr suchých krmív pre psov, 148 značiek** (+ Granula).
Zdroje: BBZoo.sk, Zoohit.sk, Superzoo.sk a stránky výrobcov. Text etikety je doslovný, každý riadok má `source_url` a dátum.

- `granule_2026-11-19.csv` – tá istá databáza ako tabuľka na kontrolu
- `pokrytie_znaciek_2026-11-19.csv` – všetkých 278 značiek predávaných na SK (Heureka.sk) a koľko z nich je v databáze

Stĺpce etikety v `products`: `composition_raw`, `analytical_raw`, `nutritional_additives_raw`,
`trace_elements_raw` (všetko s EÚ kódom 3b / E1–E8), `technological_additives_raw`, `energy_raw`.
`missing_fields` prázdne = úplná etiketa (860 produktov); inak uvádza, čo zdroj neuvádza
(najčastejšie analytické zložky pri produktoch zo Zoohit.sk). `label_language`: 1 686 sk, 90 cs, 3 en.
Skóre (`score_*`) zatiaľ nie je vypočítané.

## Analyzér

- `docs/METODIKA.md` – verejná metodika hodnotenia (verzia 2.0, schválená 26. 11. 2026)
- `docs/ANALYZER_SPEC.md` – zadanie aplikácie
- `reference/` – referenčná implementácia hodnotenia v Pythone (`scoring.py`, `ingredients_rules.py`)
- `supabase/data/zlozky_hodnotenie_v1.csv` – všetky typy zložiek so skóre a vysvetlením (na kontrolu)
- `supabase/data/zlozky_nezname.csv` – zápisy, ktoré pravidlá zatiaľ nepoznajú (~5 % výskytov)
