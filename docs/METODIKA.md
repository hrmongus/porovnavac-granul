# Metodika hodnotenia zloženia granúl – verzia 2.0

Platí od 26. 11. 2026. Analyzér prevádzkuje Granula (Spark Link, s. r. o.). Hodnotí **iba to, čo je napísané v zložení na obale** – nie značku, cenu ani tvrdenia výrobcu na webe.
Rovnaké pravidlá platia pre všetky krmivá vrátane Granuly.

## 1. Hodnotenie jednej zložky (0–100)

| Farba | Skóre | Význam |
|---|---|---|
| 🟢 zelená | 90–100 | Čistá, konkrétne pomenovaná a výživovo hodnotná zložka |
| 🟡 žltá | 70–89 | Stále kvalitná zložka |
| 🟠 oranžová | 50–69 | Pri tejto zložke je dobré spozornieť (lacné plnivo, rastlinná bielkovina, frakcia, škrob…) |
| 🔴 červená | 0–49 | Nejasný pôvod, umelá prísada alebo zložka, ktorá v kvalitnom krmive nemá čo hľadať |
| ⚪ šedá | – | Zložku zatiaľ nepoznáme; nehodnotí sa a doplníme ju |

Hlavné princípy:
- **Pomenovaný zdroj > nepomenovaný.** „Kuracie mäso“ je lepšie ako „mäso“; „lososový olej“ lepší ako „oleje a tuky“.
- **Mäso a vnútornosti:** pomenované mäso (čerstvé aj sušené) 100, pomenované vnútornosti 97.
- **Mäsová múčka 🔴** (s druhom zvieraťa 40, bez druhu 30). Sú to pomleté vedľajšie produkty z bitúnkov; z obalu sa nedá zistiť, z ktorých častí zvieraťa sú, a bielkoviny sú horšie stráviteľné ako z mäsa (Johnson a kol. 1998; Cramer a kol. 2007).
- **Sušené bielkoviny / proteín zo zvierat 🔴** (napr. „sušené hydinové bielkoviny“, „morčací proteín“) – hodnotia sa **rovnako ako múčka** (40 / 30). Podľa katalógu krmív EÚ (nariadenie 68/2013, položka 9.4.1 „spracované živočíšne bielkoviny“) ide o rovnakú kategóriu suroviny – zahriatu, vysušenú a pomletú. Výrobcovia ju sami označujú za ekvivalent múčky (Royal Canin: „dehydrated poultry protein = chicken meal“).
- **Hydrolyzované bielkoviny zo zvierat 🟠 55** (bez druhu zvieraťa 🔴 40) – vyrábajú sa z vedľajších živočíšnych produktov (položka 9.6.1); používajú sa najmä na chuť.
- **Rastlinné bielkoviny** – hrachový, zemiakový, ryžový proteín a frakcie 🟠 50; sója a lepok 🔴 35–40; bez uvedenia zdroja 🔴 45. Lacne zvyšujú číslo bielkovín na etikete.
- **Strukoviny** – hrach, šošovica, cícer 🟠 60; múka zo strukovín 🟠 55.
- **Oleje** – ľanový 🟢 90, rybie oleje 🟢/🟡, ostatné pomenované rastlinné oleje 🟡 70, „rastlinné oleje“ bez druhu 🔴 40.
- **Citlivosť nie je chyba.** Kuracie mäso je kvalitné (🟢) – zobrazí sa len poznámka, že patrí medzi častejšie alergény.
- **Nešpecifikované zdroje** („živočíšne vedľajšie produkty“, „oleje a tuky“, „obilniny“) a **umelé prísady** (farbivá, BHA/BHT, cukor) sú 🔴.

Kompletný zoznam typov zložiek je v tabuľke `ingredients` (a v `supabase/data/zlozky_hodnotenie_v1.csv`).

## 2. Skóre produktu (0–100) – štyri ukazovatele

| Ukazovateľ | Váha | Čo meria |
|---|---|---|
| **Kvalita surovín** | 55 % | Vážený priemer skóre zložiek podľa poradia na etikete: 1. zložka 30 %, 2. 20 %, 3. 15 %, 4. 10 %, 5. 8 %, zvyšných 17 % rovnomerne. |
| **Mäso v hotových granulách** | 20 % | Odhad z deklarovaných percent a formy: čerstvé mäso má ~75 % vody (do sušiny sa ráta 25 %), sušené a ostatné suroviny ~10 %. Ráta sa len pomenované mäso a vnútornosti – nie múčka, sušené ani hydrolyzované bielkoviny. 50 % mäsa a viac = 100 bodov; 25 % = 50 bodov. Ak výrobca percentá neuvádza = 30 bodov. |
| **Spracovanosť** | 10 % | Váhový podiel vysoko spracovaných surovín (múčky, sušené a hydrolyzované bielkoviny, rastlinné proteíny a frakcie, lepok, škroby, celulóza, nešpecifikované vedľajšie produkty, cukor, glycerín). 0 % = 100 bodov, každé percento −2 body, 50 % a viac = 0. |
| **Transparentnosť** | 15 % | Podiel konkrétne pomenovaných zložiek medzi prvými desiatimi (60 %) a či majú prvé tri zložky uvedené percento (40 %). |

**Stropy** (platia po výpočte):
- červená zložka medzi prvými piatimi → najviac **49**,
- umelé farbivo, syntetický konzervant alebo cukor kdekoľvek → najviac **69**.

**Čo sa nehodnotí:**
- **Sacharidy.** Odhad z analytických zložiek (100 − bielkoviny − tuk − popol − vláknina − vlhkosť) sa len zobrazí. Potreba sacharidov sa líši podľa psa (aktivita, vek, hmotnosť, zdravie) a odborná zhoda na jednom ideálnom množstve neexistuje.
- **Doplnkové látky** (vitamíny, minerály, stopové prvky) – sú zobrazené a vysvetlené.
- **Šedé (neznáme) zložky.**

| Skóre | Verdikt |
|---|---|
| 90–100 | Výborné zloženie |
| 70–89 | Kvalitné zloženie |
| 50–69 | Slabšia kvalita zloženia |
| 0–49 | Nekvalitné zloženie |

## 3. Ako sa krmivo hodí pre konkrétneho psa (0–100)

Samostatné skóre podľa odpovedí o psovi. Začína sa na 100 a odpočítava sa za nesúlad: alergén psa v zložení (strop 20), krmivo pre inú životnú fázu (−15 až −30) alebo veľkosť (−10), vysoký tuk pri pankrease (−30/−40) alebo nadváhe (−20), málo bielkovín či tuku pre športového psa (−10/−15), veľa tuku pri malom pohybe (−10), veľa druhov mäsa alebo pšenica/kukurica/sója pri citlivom trávení (−10/−15), chýbajúca kĺbová výživa pri veľkých plemenách a senioroch (−5).
85–100 hodí sa výborne, 65–84 s výhradami, 40–64 skôr nie, 0–39 nehodí sa. Rovnaké pravidlá platia aj pre receptúry Granula. Nie je to veterinárna rada.

## 4. Porovnanie s trhom

Výsledok sa porovná so skóre 1 784 granúl na slovenskom trhu (zber 2026-11): „lepšie ako X % granúl“.
Žiadna značka sa pri tom nezobrazuje. Pri krmivách zo zoznamu uvádzame dátum a zdroj zloženia.

## 5. Zmeny metodiky

Každá zmena = nová verzia v tabuľke `methodology_versions` s popisom, čo sa zmenilo.
Každá analýza ukladá, podľa ktorej verzie bola vypočítaná.

- **2.0 (26. 11. 2026)** – štyri ukazovatele namiesto jedného; sušené bielkoviny = múčka; hydrolyzáty, rastlinné proteíny a strukoviny nižšie; pomenované rastlinné oleje 70.
- **1.0** – hodnotenie zložiek a vážený priemer podľa poradia.

## Zdroje

- Nariadenie Komisie (EÚ) č. 68/2013 o katalógu kŕmnych surovín, časť C, kapitola 9 (9.4.1, 9.6.1).
- Royal Canin: Understanding by-products in cat and dog food (royalcanin.com).
- Johnson a kol., Journal of Animal Science, 1998; Cramer a kol., Journal of Animal Science, 2007.
- FEDIAF: Code of Good Labelling Practice for Pet Food, 2019.
