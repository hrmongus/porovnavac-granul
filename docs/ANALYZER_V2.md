# Analyzér 2.0 – zadanie

Stav: 26. 11. 2026. Pôvodné zadanie je v `ANALYZER_SPEC.md`; tento dokument ho rozširuje a mení postup, výsledky a metodiku.

## 1. Postup (flow)

1. **Vyber granule** – tri spôsoby na jednej obrazovke: vyhľadať v zozname (predvolené), odfotiť zloženie, vložiť text.
2. **Pár otázok o psovi** – rovnaké ako konfigurátor na granula.sk (pozri bod 3), max. 5 obrazoviek.
3. **Animácia vyhodnocovania** (3–5 s): „Čítame 24 zložiek…“, „Porovnávame s 1 784 granulami…“, „Počítame dávku pre Bobíka…“. Texty musia zodpovedať tomu, čo sa naozaj počíta.
4. **Okno: meno a e-mail** – povinné na zobrazenie výsledku. Pod tým **nezaškrtnuté** políčko súhlasu s marketingovými e-mailami (samostatné, dobrovoľné; výsledok sa zobrazí aj bez neho). Odkaz na Ochranu osobných údajov.
5. **Výsledok** – pozri bod 4. Kópia výsledku príde e-mailom.

Heslo pri vstupe **odstrániť**. Namiesto neho: `noindex, nofollow` (meta + `X-Robots-Tag`), `robots.txt` s `Disallow: /`, rate limit a Turnstile ostávajú (ochrana kreditu Claude API).

## 2. Výber zo zoznamu

- Vyhľadávanie podľa značky aj názvu, bez ohľadu na diakritiku; po 2 znakoch max. 10 návrhov.
- Pri výsledku: „Zloženie podľa etikety, stav k [composition_date]. Zdroj: [doména]. Výrobca mohol recept zmeniť.“ + „Nahlásiť chybu“.
- Ak produkt chýba: „Nenašli ste? Odfoťte zloženie alebo ho vložte.“ Neúspešné hľadanie ulož anonymne (len hľadaný text a dátum; nová tabuľka s RLS, insert iba cez server).
- **Žiadne rebríčky značiek, žiadne „top 10“, žiadne porovnanie značka A vs. značka B.** Percentil ostáva anonymný.
- **Fotky balení iných značiek nezobrazovať ani neukladať** (autorské práva k fotkám majú výrobcovia/e-shopy). Zobrazuj značku + názov. Fotky Granuly áno (`https://www.granula.sk/img/produkty/...`).
- Granula je v databáze ako značka `Granula` (`is_granula = true`), 5 receptúr – súbor `supabase/data/granula_produkty_2026-11-26.sql`. Hodnotí sa rovnakou metodikou ako všetky ostatné, bez výnimiek.

## 3. Otázky o psovi (zhodné s granula.sk)

Logiku **neprepisuj odznova**: prevezmi z `https://www.granula.sk/engine.js` (vlastný kód Granuly) tabuľku plemien `BREEDS`, `PARAMS` (šteňa/senior podľa veľkosti, násobky RER) a výpočet energie. Skopíruj do `lib/dog/engine.ts` a uveď zdroj v komentári.

Obrazovky:
1. Meno + pohlavie
2. Plemeno (vyhľadávanie; kríženec malý/stredný/veľký)
3. Hmotnosť + vek
4. Bežný deň (aktivita) + kastrovaný + postava (chudší / akurát / kilo navyše)
5. Zameranie (viac možností: citlivé trávenie, kĺby a pohyb, srsť a koža, váha, pankreas, nič) + alergie (kuracie, hovädzie, bravčové, morka, kačica, hus, jahňacie, jeleň, králik, ryby, vajcia, ryža, zemiaky, pšenica, kukurica, sója)

## 4. Výsledok – menej je viac

Psíčkar chce počuť tri veci: **je to dobré jedlo? sedí to môjmu psovi? koľko mu dávať?** Všetko ostatné je až pod tým.

Poradie na obrazovke:

1. **Veľké skóre a verdikt** – napr. „72/100 · Kvalitné zloženie“ + „Lepšie ako 58 % granúl na slovenskom trhu“.
2. **„Ako sa hodí pre Bobíka: 72/100 · Hodí sa s výhradami“** + max. 3 dôvody (bod 5).
3. **„Bobík by mal zjesť cca 230 g denne“** – z engine.js (energia psa) a energie krmiva (bod 6). Ak chýbajú analytické zložky, riadok skry.
4. **3 hlavné zistenia** – 1 najlepšie + max. 2 najhoršie, jednou vetou ľudskou rečou. Príklady:
   - „Mäso tvorí odhadom 48 % granúl. Bežné granule na trhu majú okolo 31 %.“
   - „Na 2. mieste je kukurica – lacný zdroj energie, nie bielkovín.“
   - „Výrobca neuvádza, z akého zvieraťa je mäso.“
5. **Štyri ukazovatele** – krátke pruhy s jedným slovom (Výborné/Dobré/Priemer/Slabé): Kvalita surovín, Mäso, Spracovanosť, Transparentnosť (bod 7). Klik = jedna veta vysvetlenia.
6. **Zložky** – zbalený zoznam („Zobraziť všetkých 24 zložiek“), farebné štítky, klik = vysvetlenie.
7. **Odporúčanie Granula** – oddelený blok až na konci, pozri bod 9. Hodnotenie samotné nikdy neobsahuje reklamu.

Sacharidy (odhad z analytických zložiek) zobrazuj len ako informáciu v detaile, **nehodnotia sa** – odborná zhoda na ideálnom množstve nie je.

## 5. Ako sa hodí pre psa – skóre 0–100

Rovnaké pravidlá pre každé krmivo – aj pre odporúčanú receptúru Granula. Začína sa na 100, odpočítava sa:

| Kontrola | Kedy | Odpočet | Dôvod (text pre používateľa) |
|---|---|---|---|
| Alergia | krmivo obsahuje alergén psa (druh zvieraťa z kľúča zložky vrátane tuku a pečene; ryža, zemiaky, vajcia, ryby, pšenica, kukurica, sója) | **strop 20** | „Obsahuje kuracie (kurací tuk) – Bobík naň nemusí reagovať dobre.“ |
| Šteňa na krmive pre dospelých | fáza psa šteňa/štartér a krmivo je pre dospelých/seniorov | −30 | „Krmivo nie je určené pre šteňatá v raste.“ |
| Dospelý na krmive pre šteňatá | dospelý/senior a krmivo puppy/junior | −15 | |
| Veľkosť | názov výslovne pre inú veľkosť (mini/small vs. large/maxi/giant) | −10 | |
| Pankreas | tuk > 14 % / > 18 % | −30 / −40 | „Má 20 % tuku. Pri problémoch s pankreasom sa poraď s veterinárom.“ |
| Nadváha | postava „kilo navyše“ alebo zameranie „váha“ a tuk ≥ 16 % | −20 | |
| Šport, práca | bielkoviny < 24 % / tuk < 14 % | −15 / −10 | |
| Málo pohybu, senior | tuk ≥ 18 % | −10 | |
| Citlivé trávenie, „nesedí mu každé mäso“ (rovnaká podmienka ako `d.intolerance` v engine.js) | druhy zvierat len z mäsa, vnútorností, múčok a bielkovín (tuky a oleje sa nerátajú – rovnako ako „monoproteín“ v engine.js): 2 druhy −5, 3 a viac −15 / pšenica, kukurica alebo sója v top 5 −10 | −5 / −15 / −10 | „Má 4 druhy mäsa (morka, hus, kačica, kura). Pri citlivom trávení je vhodnejší jeden druh.“ |
| Kĺby | zameranie „kĺby“, veľké/obrie plemeno alebo senior a krmivo nemá glukozamín ani chondroitín – hľadaj v zložení **aj** v nutričných doplnkových látkach **aj** v stopových prvkoch (`analytical_raw`, `nutritional_additives_raw`, `trace_elements_raw`; výrobcovia ich uvádzajú na rôznych miestach) | −5 | |

- Fáza a veľkosť psa: z engine.js (`derive`). Fáza a veľkosť krmiva: `life_stage`, inak z názvu (puppy, junior, šteňa, štěně, adult, senior, mini, small, medium, maxi, large, giant).
- Ak názov produktu začína značkou, značku pred názvom nezobrazuj druhýkrát („Panakei Panakei…“).
- Ak chýbajú analytické zložky, kontroly tuku a bielkovín sa neodpočítajú, ale zobrazí sa „Obsah tuku výrobca neuvádza – nevieme posúdiť.“
- Pásma: **85–100 Hodí sa výborne · 65–84 Hodí sa s výhradami · 40–64 Skôr sa nehodí · 0–39 Nehodí sa.**
- Zobraz max. 3 dôvody (najväčšie odpočty). Pri zdravotných témach: „Nie je to veterinárna rada.“

## 6. Dávka

- Energia krmiva: ak ju výrobca uvádza, použi ju. Inak rovnaký výpočet ako konfigurátor – `metabolizable()` z engine.js (NRC 2006: hrubá energia → stráviteľnosť podľa vlákniny → metabolizovateľná energia); chýbajúca vlhkosť = 10 %, popol = 7 %.
- Potreba psa – `energy()` z engine.js (RER × násobok).
- Text: „cca X g denne (odhad). Začni touto dávkou a podľa váhy dolaď o ±10 %.“

## 7. Metodika 2.0 – SCHVÁLENÁ (26. 11. 2026)

Popis: `docs/METODIKA.md`. Výpočet je hotový v `lib/scoring/analyze.ts` (`METHODOLOGY_VERSION = '2.0'`);
`analyze()` vracia okrem `score` aj `parts` (kvalita surovín, odhad % mäsa, body za mäso, % spracovaných surovín,
body za spracovanosť, transparentnosť) a `carbsEstimate(analytical)` dáva odhad sacharidov (nehodnotí sa).
Referenčná implementácia `reference/scoring.py`; TS a Python sa zhodujú na všetkých 1 784 produktoch.

Ukazovatele zobraz vo výsledku (bod 4.5) slovami: 90+ Výborné, 70+ Dobré, 50+ Priemer, inak Slabé.
Pri mäse zobraz odhad v % („Mäso tvorí odhadom 48 % granúl. Medián trhu: X %.“), pri neuvedenom „Výrobca neuvádza percentá mäsa“.

V databáze: `products.score_total`, `score_quality`, `score_meat`, `score_processing`, `score_transparency`,
`meat_percent_est`, `processed_percent`, `carbs_percent_est`, `methodology_version = '2.0'`
(migrácia `20261126040000_methodology_2_0.sql`, dáta `supabase/data/zlozky_a_skore_v2.sql`).

Rozloženie trhu: medián 49, 90+ má 67 produktov, pod 50 je 1 113 z 1 784. Granula 91–96.

## 8. Fronta na doplnenie (neznáme zložky a chýbajúce krmivá)

Databázová časť je hotová (migrácia `20261126060000_na_doplnenie.sql`):
- `analyses.product_hint` – nepovinné „Aké granule to sú?“ pri fotke/texte,
- `search_misses` – neúspešné hľadania v zozname (iba text a čas, RLS, zápis len cez server),
- pohľady `na_doplnenie_zlozky` a `na_doplnenie_krmiva` (len service_role). Zložka z fronty zmizne sama, keď pre ňu pribudne alias.

Treba dorobiť v aplikácii:
1. Pri fotke a texte nepovinné pole **„Aké granule to sú? (značka a názov)“**, max. 200 znakov → `product_hint`.
2. Keď hľadanie v zozname nič nenájde (≥ 3 znaky, po 1,5 s bez písania), server uloží dopyt do `search_misses`. Rate limit ako pri analýze.
3. **Týždenný e-mail** (pondelok 7:00, Netlify scheduled function + Resend) na `info@granula.sk`: 20 najčastejších neznámych zložiek a 20 najčastejších chýbajúcich krmív s počtom a príkladom. Ak je fronta prázdna, e-mail nechodí.
4. Neznáma zložka sa vo výsledku zobrazí šedou s vetou „Túto zložku zatiaľ nepoznáme – doplníme ju.“ (už je).

Doplnenie robí Claude (plánovacia relácia): pravidlá v `reference/ingredients_rules.py` → `scripts/gen_rules_data.py` → nový dátový súbor so zložkami, aliasmi a prepočítaným skóre.

## 9. Odporúčanie Granula na mieru

Blok na konci výsledku, vizuálne oddelený, s nadpisom **„Granule na mieru pre Bobíka“** a malým textom:
„Analyzér prevádzkuje Granula. Naše receptúry hodnotíme rovnakou verejnou metodikou ako všetky ostatné.“

- Receptúru vyberá `compute(answers)` z engine.js – presne ako konfigurátor na granula.sk (pravidlá R1–R10, alergie, intolerancie, pankreas…). Analyzér nič nevyberá inak.
- Zobraz: názov a fotku receptúry, **skóre zloženia** a **ako sa hodí pre Bobíka** (bod 5, rovnaké pravidlá), **dennú dávku v gramoch** a cenu na deň (z `bags` v engine.js), 1–2 dôvody výberu (`rule.why`).
- **Porovnanie vedľa seba** (iba objektívne údaje): skóre zloženia, hodí sa pre Bobíka, mäso v granulách (%), dávka g/deň. Pri krmive používateľa sa cena nezobrazuje (nemáme ju).
- Slová „lepšie“, „vhodnejšie“ použi iba vtedy, keď je receptúra Granula vyššie **v oboch** skóre. Inak len „Granule vyskladané podľa Bobíkových potrieb“.
- Ak engine nenájde vhodnú receptúru (napr. alergia na všetky druhy mäsa), blok ukáže: „Pre Bobíka teraz nemáme vhodnú receptúru.“ – nič iné neponúkaj.
- Tlačidlo: „Objednať granule pre Bobíka →“ na `https://www.granula.sk/granule-na-mieru.html` s predvyplnenými odpoveďami (ak to konfigurátor podporuje, inak len UTM) – `utm_source=analyzer&utm_medium=web&utm_campaign=vysledok`.
- V e-maile s výsledkom rovnaký blok, oddelený od hodnotenia.

## 10. Prepojenie s konfigurátorom na granula.sk (zákazník nevypĺňa 2×)

granula.sk to už vie: `granule-na-mieru.html?kviz=<uuid>` načíta odpovede zo servera (`GET https://www.granula.sk/api/quiz/<uuid>`)
a otvorí rovno **výsledok** (#vysledok) s vybranou receptúrou, vrecom a objednávkou. Odpovede sa ukladajú cez
`POST https://www.granula.sk/api/quiz` (tabuľka `quiz_sessions`) – rovnako ako to robí `kviz.js`.

Postup v analyzéri:
1. Otázky o psovi ukladaj **presne v tvare konfigurátora** – kľúče `dogname, sex, breed, breedSet, kg, years, months, weeks,
   activity, neutered, pregnant, body, focus, allergies` a ich hodnoty (id plemien z `BREEDS`, aktivita, postava, zameranie
   a alergie podľa `kviz.js` / `engine.js` na granula.sk). Žiadne vlastné hodnoty – inak sa odpovede neprenesú.
2. Pri zobrazení výsledku **server analyzéra** (nie prehliadač – kvôli CORS) pošle
   `POST https://www.granula.sk/api/quiz` s telom
   `{ id: <nové uuid v4>, step: "vysledok", answers: {…}, plan: "mesiac", utm: { utm_source: "analyzer", utm_medium: "web", utm_campaign: "vysledok" }, referrer: "", landing: "analyzer" }`.
   Uuid ulož k analýze (`analyses.granula_quiz_id`, nová migrácia).
3. Tlačidlo „Objednať granule pre Bobíka →“ vedie na
   `https://www.granula.sk/granule-na-mieru.html?kviz=<uuid>&utm_source=analyzer&utm_medium=web&utm_campaign=vysledok`.
   Rovnaký odkaz v e-maile s výsledkom.
4. Ak POST zlyhá, odkaz ide bez `kviz` na začiatok konfigurátora – nič sa nezastaví.
5. Otestuj na produkcii granula.sk: po kliknutí sa musí otvoriť výsledok s rovnakým menom psa, receptúrou a dávkou ako v analyzéri.
   Ak granula.sk požiadavku z iného servera odmietne (kontrola pôvodu), napíš presne čo treba povoliť na strane granula.sk.

Do ochrany osobných údajov doplň: odpovede o psovi (bez e-mailu) sa pri kliknutí na odporúčanie odovzdajú konfigurátoru
na granula.sk, ktorý prevádzkuje ten istý prevádzkovateľ (Spark Link, s. r. o.).

Voliteľne opačným smerom: konfigurátor na granula.sk môže vo výsledku ponúknuť „Porovnaj so svojimi súčasnými granulami“ →
`analyzer/?kviz=<uuid>`; analyzér si odpovede načíta cez `GET /api/quiz/<uuid>` a otázky o psovi preskočí.

### 9.1 Kedy odporúčať (rozhodnutie majiteľky, 26. 11. 2026)

Odporúča sa **iba receptúra Granula** a **iba taká, ktorá sa psovi hodí na 100/100** (bod 5).

1. **Krmivo používateľa sa psovi hodí na 100/100** → **žiadne odporúčanie** (ani Granula). Text: „Tieto granule sa Erikovi hodia na 100 %.“
   Ak je to receptúra Granula, pridaj tlačidlo „Objednať granule pre psa Erik →“ (kviz s `recipe` = táto receptúra).
2. **Hodí sa menej ako na 100** → vyber receptúru Granula, ktorá sa hodí na 100/100, v tomto poradí:
   receptúra z `compute()` (engine.js) → druhá možnosť (`second`) → ostatné vhodné receptúry v poradí katalógu.
   Prvá, ktorá má „hodí sa“ = 100, sa odporučí. Dávka, cena a odkaz (kviz s `recipe` = vybraná, `recipeFor` = z engine) sú pre ňu.
3. **Žiadna receptúra Granula nemá 100/100** → blok s odporúčaním sa nezobrazí vôbec.
4. Pri odporúčaní tabuľka krmivo používateľa vs. odporúčaná receptúra + jedna veta prečo (dôvody odpočtov pri krmive používateľa,
   ktoré odporúčaná receptúra nemá). Slovo „lepšie“ iba keď je receptúra Granula vyššie aj v skóre zloženia.

Kontrolné prípady:
- Pes s citlivým trávením, analyzovaná Granula Morka, hus & kačica → hodí sa 85 → odporučí sa Jahňa (ak má 100) s dôvodom „jeden druh mäsa“.
- Ten istý pes, analyzované Jahňa (100) → žiadne odporúčanie, len „hodia sa na 100 %“ a tlačidlo objednať.
- Pes bez zvláštnych potrieb, analyzovaná iná značka s „hodí sa“ 100 → žiadne odporúčanie.
