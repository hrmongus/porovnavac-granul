# Porovnávač granúl

Porovnávač krmív (granúl) pre psov a mačky – zloženie a cena za kg naprieč obchodmi.

## Databáza (Supabase)

Projekt: `https://mqgukyfttafavlnlaoyj.supabase.co`

1. Supabase Dashboard → **SQL Editor** → New query
2. Vlož a spusti `supabase/migrations/20261119000000_init.sql`
3. (voliteľné) Spusti `supabase/seed.sql` pre ukážkové dáta
4. Skopíruj `.env.example` do `.env`

### Tabuľky
- `brands` – značky
- `products` – granule vrátane analytických zložiek (%), energie a zloženia
- `shops` – obchody
- `prices` – ceny balení; `price_per_kg` sa počíta automaticky
- pohľad `product_comparison` – produkt + najnižšia cena/kg + bielkoviny v sušine

RLS: všetci môžu čítať, zapisovať sa dá len cez dashboard alebo `service_role` kľúčom.

### Použitie v JS
```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY)
const { data } = await supabase
  .from('product_comparison')
  .select('*')
  .eq('animal', 'pes')
  .order('min_price_per_kg')
```
