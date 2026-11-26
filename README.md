# Porovnávač granúl

Analyzér zloženia granúl pre psov – rozpad zloženia na zložky, vysvetlenia a skóre podľa verejnej metodiky.

## Databáza (Supabase)

Projekt: `https://mqgukyfttafavlnlaoyj.supabase.co`

1. Supabase Dashboard → **SQL Editor** → New query
2. Vlož a spusti `supabase/migrations/20261119000000_init.sql`
3. (voliteľné) Spusti `supabase/seed.sql` pre ukážkové dáta
4. Skopíruj `.env.example` do `.env`

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
