# Zadanie: Analyzér zloženia granúl (MVP)

Webová aplikácia na samostatnej doméne. Prevádzkuje Granula (granula.sk), ale analyzér je **neutrálny**:
hodnotí výhradne zložky z textu zloženia, nikdy nezobrazuje ani nehodnotí značky.
Cieľ biznisu: získať e-mail (lead) so súhlasom.

## Používateľský tok

1. **Vstup** (jedna stránka, mobil na prvom mieste):
   - nahranie fotky zloženia z vrecka (fotoaparát v mobile alebo súbor), **alebo**
   - vloženie textu zloženia do poľa.
2. **Rozpoznanie textu z fotky:** pomocou AI (Claude API, vision) – AI **len prepíše text zloženia**
   z fotky (aj s percentami). AI nikdy nehodnotí. Používateľ vidí rozpoznaný text a môže ho opraviť.
3. **Analýza** (deterministická, bez AI): rozdelenie textu na zložky → priradenie k databáze → skóre.
4. **Výsledok zadarmo na obrazovke:**
   - veľké skóre a verdikt, napr. „Kvalitné zloženie 76/100“,
   - tabuľka všetkých zložiek v poradí z etikety; každý riadok farebne (zelená/žltá/oranžová/červená/šedá)
     s číslom skóre zložky,
   - vysvetlenie v ľudskej reči je viditeľné **len pri prvých 3 zložkách**, pri ostatných je rozmazané
     s výzvou „Celý rozbor vám pošleme na e-mail“,
   - krátka legenda farieb a odkaz na stránku Metodika.
5. **E-mailová brána:** pole e-mail, voliteľne meno psa, a **nezaškrtnuté** políčko súhlasu s marketingom.
   Rozbor sa pošle aj bez súhlasu s marketingom (poslanie výsledku nie je podmienené súhlasom).
6. **E-mail s výsledkom:** celý rozbor všetkých zložiek, porovnanie s trhom („lepšie ako X % granúl
   na slovenskom trhu“ – bez značiek), trvalý odkaz na výsledok, a samostatný box „Od prevádzkovateľa: Granula“.
   Ak nebol daný súhlas s marketingom, v e-maile je odkaz na jeho dodatočné potvrdenie.
7. **Trvalý odkaz** `/vysledok/{id}` zobrazí uložený celý rozbor.

Ďalšie stránky: **Metodika** (obsah `docs/METODIKA.md`), **Ochrana osobných údajov**,
**Nahlásiť chybu** (formulár do tabuľky `error_reports`).

## Databáza (Supabase – už existuje, nemeniť schému bez dôvodu)

Projekt: `https://mqgukyfttafavlnlaoyj.supabase.co`. Schéma a dáta sú v `supabase/migrations` a `supabase/data`
(poradie spúšťania je v README).

- `ingredients` – 225 typov zložiek: `slug`, `name_sk`, `score` (0–100), `color`, `what_it_is` (vysvetlenie),
  `sensitivity_flags`, `category`, `classification`.
- `ingredient_aliases` – 3 511 zápisov z etikiet (lowercase) → `ingredient_id`.
- `products.score_total` – skóre 1 779 granúl trhu; slúži **len** na výpočet percentilu („lepšie ako X %“).
- `methodology_versions` – verzia 1.0 s pravidlami v `rules` (jsonb).
- `leads` – e-mail, meno psa, `consent_marketing`, `consent_text` (presné znenie, ktoré používateľ videl), `consent_at`.
- `analyses` – uložená analýza (`input_type`, `input_raw`, `result` jsonb, `unknown_items`, `lead_id`,
  `methodology_version`); `id` je trvalý odkaz.
- RLS: verejnosť (publishable key) smie len čítať zložky/metodiku/produkty a vložiť hlásenie chyby.
  **`leads` a `analyses` zapisuje iba server** so service_role kľúčom (nikdy prehliadač).

## Algoritmus analýzy (presne podľa referenčnej implementácie)

Referenčná implementácia v Pythone je v `reference/` – prepíš ju do jazyka aplikácie a zachovaj výsledky:
- `reference/scoring.py` – rozdelenie textu, váhy, stropy, verdikt,
- `reference/ingredients_rules.py` – záložné pravidlá pre zápisy, ktoré nie sú v `ingredient_aliases`.

Postup:
1. Rozdeliť zloženie podľa čiarok/bodkočiarok **mimo zátvoriek**; desatinná čiarka (`2,5 %`) sa nedelí.
2. Z každej položky vytiahnuť percento (ak je), normalizovať (lowercase, bez zátvoriek a čísel).
3. Nájsť v `ingredient_aliases`; ak nie je, použiť záložné pravidlá; ak ani tie → šedá „neznáma“
   (uložiť do `analyses.unknown_items`).
4. Skóre produktu: váhy 30/20/15/10/8 pre 1.–5. zložku, zvyšných 17 rovnomerne; stropy 49 a 69;
   šedé sa nepočítajú. Verdikty: ≥90 Výborné, ≥70 Kvalitné, ≥50 Slabšia kvalita, inak Nekvalitné zloženie.
5. Percentil: podiel `products.score_total` nižších ako výsledok.

**Test správnosti:** pre všetkých 1 779 produktov musí aplikácia vypočítať rovnaké `score_total`,
aké je v databáze (tolerancia ±1).

## Technické požiadavky

- Jednoduchý stack, napr. Next.js + Supabase + Vercel (alebo podobný hosting) – vyber a zdôvodni.
- Kľúče len v premenných prostredia (`.env`), nikdy v kóde ani v gite.
- Posielanie e-mailov cez transakčnú službu (napr. Resend) – kľúč v `.env`.
- Ochrana proti spamu na formulároch (limit požiadaviek / jednoduchá captcha).
- Fotky sa po prepise textu neukladajú.
- Rozhranie po slovensky, tón vecný a neemotívny (žiadne „toxické“, žiadne výkričníky).
- Prístupnosť: farba nikdy nie je jediný nosič informácie (vždy aj číslo a slovo).
