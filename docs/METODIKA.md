# Metodika hodnotenia zloženia granúl – verzia 1.0 (návrh)

Analyzér hodnotí **iba zložky v texte zloženia**, nie značku, cenu ani výrobcu.
Rovnaké pravidlá platia pre všetky krmivá vrátane Granuly.

## 1. Hodnotenie jednej zložky (0–100)

| Farba | Skóre | Význam |
|---|---|---|
| 🟢 zelená | 90–100 | Čistá, konkrétne pomenovaná a výživovo hodnotná zložka |
| 🟡 žltá | 70–89 | Stále kvalitná zložka |
| 🟠 oranžová | 50–69 | Pri tejto zložke je dobré spozornieť (lacné plnivo, frakcia, škrob…) |
| 🔴 červená | 0–49 | Nejasný pôvod, umelá prísada alebo zložka, ktorá v kvalitnom krmive nemá čo hľadať |
| ⚪ šedá | – | Zložku zatiaľ nepoznáme; nehodnotí sa a doplníme ju |

Hlavné princípy:
- **Pomenovaný zdroj > nepomenovaný.** „Kuracie mäso“ je lepšie ako „mäso“; „lososový olej“ lepší ako „oleje a tuky“.
- **Forma mäsa:** pomenované mäso (čerstvé aj sušené) 100, vnútornosti 97, bielkovina 90, hydrolyzát 85.
- **Mäsová múčka je 🔴** (pomenovaná 40, bez druhu zvieraťa 30). Sú to pomleté vedľajšie produkty z bitúnkov a z obalu sa nedá zistiť, z ktorých častí zvieraťa sú; stráviteľnosť bielkovín je nižšia než pri mäse (Johnson a kol. 1998, Cramer a kol. 2007). Múčka medzi prvými piatimi zložkami preto obmedzí skóre produktu na najviac 49.
  Pri čerstvom mäse upozorníme, že obsahuje ~70 % vody. Najlepšie zloženia tak môžu dosiahnuť 100/100.
- **Citlivosť nie je chyba.** Kuracie mäso je kvalitné (🟢) – zobrazí sa len poznámka, že patrí medzi častejšie alergény.
- **Lacné plnivá** (kukurica, pšenica, škroby, hrachové frakcie) sú 🟠 – je to fakt o ich výživovej hodnote, nie názor.
- **Nešpecifikované zdroje** („živočíšne vedľajšie produkty“, „oleje a tuky“, „obilniny“) a **umelé prísady** (farbivá, BHA/BHT, cukor) sú 🔴.

Kompletný zoznam 225 typov zložiek je v tabuľke `ingredients` (a v `supabase/data/zlozky_hodnotenie_v1.csv`).

## 2. Skóre produktu (0–100)

1. **Vážený priemer podľa poradia na etikete** (prvé zložky tvoria väčšinu krmiva):
   1. zložka 30 %, 2. 20 %, 3. 15 %, 4. 10 %, 5. 8 %, zvyšných 17 % sa delí rovnomerne.
2. **Stropy:**
   - červená zložka medzi prvými piatimi → najviac **49**,
   - umelé farbivo, syntetický konzervant alebo cukor kdekoľvek → najviac **69**.
3. **Doplnkové látky** (vitamíny, minerály, stopové prvky) sa do skóre nepočítajú – sú len zobrazené a vysvetlené.
4. **Šedé (neznáme) zložky** sa do výpočtu nepočítajú.

| Skóre | Verdikt |
|---|---|
| 90–100 | Výborné zloženie |
| 70–89 | Kvalitné zloženie |
| 50–69 | Slabšia kvalita zloženia |
| 0–49 | Nekvalitné zloženie |

## 3. Porovnanie s trhom

Výsledok sa porovná so skóre 1 779 granúl na slovenskom trhu (zber 2026-11): „lepšie ako X % granúl“.
Žiadna značka sa pri tom nezobrazuje.

## 4. Zmeny metodiky

Každá zmena = nová verzia v tabuľke `methodology_versions` s popisom, čo sa zmenilo.
Každá analýza ukladá, podľa ktorej verzie bola vypočítaná.
