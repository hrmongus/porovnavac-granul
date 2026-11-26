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
2. **„Pre Bobíka“** – jedna z troch viet: ✅ Sedí / ⚠️ Sedí s výhradami / ❌ Nesedí + max. 3 dôvody (bod 5).
3. **„Bobík by mal zjesť cca 230 g denne“** – z engine.js (energia psa) a energie krmiva (bod 6). Ak chýbajú analytické zložky, riadok skry.
4. **3 hlavné zistenia** – 1 najlepšie + max. 2 najhoršie, jednou vetou ľudskou rečou. Príklady:
   - „Mäso tvorí odhadom 48 % granúl. Bežné granule na trhu majú okolo 31 %.“
   - „Na 2. mieste je kukurica – lacný zdroj energie, nie bielkovín.“
   - „Výrobca neuvádza, z akého zvieraťa je mäso.“
5. **Štyri ukazovatele** – krátke pruhy s jedným slovom (Výborné/Dobré/Priemer/Slabé): Kvalita surovín, Mäso, Spracovanosť, Transparentnosť (bod 7). Klik = jedna veta vysvetlenia.
6. **Zložky** – zbalený zoznam („Zobraziť všetkých 24 zložiek“), farebné štítky, klik = vysvetlenie.
7. **Výzva** – oddelená čiarou, až na konci: „Chceš granule presne pre Bobíka? Vyskladaj si ich na granula.sk“ → `https://www.granula.sk/granule-na-mieru.html` s UTM parametrami. Hodnotenie samotné nikdy neobsahuje reklamu.

Sacharidy (odhad z analytických zložiek) zobrazuj len ako informáciu v detaile, **nehodnotia sa** – odborná zhoda na ideálnom množstve nie je.

## 5. Ako sedí pre psa (bez čísla, len pravidlá s dôvodom)

| Kontrola | Z čoho | Výsledok |
|---|---|---|
| Alergia | alergény psa × zložky (druh zvieraťa z kľúča zložky, ryža, zemiaky, vajcia, ryby, pšenica, kukurica, sója; aj tuky a pečeň daného zvieraťa) | obsahuje → ❌ „Obsahuje kuracie (kurací tuk)“ |
| Životná fáza | fáza psa (engine.js) × `life_stage` / názov produktu (puppy, junior, adult, senior) | nesúlad → ⚠️ |
| Veľkosť | veľkosť plemena × názov (mini/small/medium/maxi/large/giant) | nesúlad → ⚠️ |
| Pankreas | tuk > 14 % | ⚠️ „Má 20 % tuku. Pri problémoch s pankreasom sa poraď s veterinárom.“ |
| Nadváha | postava „kilo navyše“ alebo zameranie „váha“ a tuk ≥ 16 % | ⚠️ |
| Aktivita | pracovný/športový pes a bielkoviny < 24 % alebo tuk < 14 % | ⚠️ |
| Kĺby | veľké/obrie plemeno, senior alebo zameranie „kĺby“ a krmivo má glukozamín/chondroitín | ✅ plus |
| Citlivé trávenie | zameranie „citlivé trávenie“ a ≥ 3 druhy zvierat alebo pšenica/kukurica/sója v top 5 | ⚠️ |

Výsledok: žiadna výhrada = ✅, aspoň jedna ⚠️ = „Sedí s výhradami“, aspoň jedno ❌ = „Nesedí“. Pri zdravotných témach vždy veta „Nie je to veterinárna rada.“

## 6. Dávka

- Energia krmiva (kcal/100 g) – ak ju výrobca uvádza, použi ju. Inak odhad (modifikované Atwaterove faktory, NRC 2006): `3,5 × bielkoviny + 8,5 × tuk + 3,5 × NBE`, NBE = 100 − bielkoviny − tuk − popol − vláknina − vlhkosť (vlhkosť chýba → 10 %).
- Potreba psa – engine.js (RER × násobok).
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

Databázová časť je hotová (migrácia `20261126050000_na_doplnenie.sql`):
- `analyses.product_hint` – nepovinné „Aké granule to sú?“ pri fotke/texte,
- `search_misses` – neúspešné hľadania v zozname (iba text a čas, RLS, zápis len cez server),
- pohľady `na_doplnenie_zlozky` a `na_doplnenie_krmiva` (len service_role). Zložka z fronty zmizne sama, keď pre ňu pribudne alias.

Treba dorobiť v aplikácii:
1. Pri fotke a texte nepovinné pole **„Aké granule to sú? (značka a názov)“**, max. 200 znakov → `product_hint`.
2. Keď hľadanie v zozname nič nenájde (≥ 3 znaky, po 1,5 s bez písania), server uloží dopyt do `search_misses`. Rate limit ako pri analýze.
3. **Týždenný e-mail** (pondelok 7:00, Netlify scheduled function + Resend) na `info@granula.sk`: 20 najčastejších neznámych zložiek a 20 najčastejších chýbajúcich krmív s počtom a príkladom. Ak je fronta prázdna, e-mail nechodí.
4. Neznáma zložka sa vo výsledku zobrazí šedou s vetou „Túto zložku zatiaľ nepoznáme – doplníme ju.“ (už je).

Doplnenie robí Claude (plánovacia relácia): pravidlá v `reference/ingredients_rules.py` → `scripts/gen_rules_data.py` → nový dátový súbor so zložkami, aliasmi a prepočítaným skóre.
