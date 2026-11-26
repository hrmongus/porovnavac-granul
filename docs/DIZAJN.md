# Dizajn analyzéra – rovnaká estetika ako granula.sk

Zdroj: štýly na https://www.granula.sk/ (zmerané 26. 11. 2026). Analyzér má vyzerať ako súčasť značky Granula.

## Farby (CSS premenné – použiť presne tieto názvy a hodnoty)

```css
:root {
  --g-mlieko: #F4EBE2;        /* pozadie stránky */
  --g-mlieko-light: #FFF7EE;  /* pozadie kariet, odznakov, polí */
  --g-noc: #000000;           /* text, rámiky */
  --g-oranz: #FF6900;         /* hlavné tlačidlá, logo, akcenty */
  --g-kobalt: #0047BB;        /* zvýraznené slová v nadpisoch, sekundárne tlačidlo */
  --g-kobalt-soft: #2F68CC;
  --g-limetka: #C9F04D;       /* štítky ako „Vytvorené s veterinármi“ */
  --err: #B3261E;             /* chybové hlášky formulárov */
}
```

## Písmo

- **Montserrat** (Google Fonts, váhy 400, 600, 700, 800, 900 + 900 italic). Načítať cez `next/font/google`.
- Zásobník: `'Proxima Nova', 'Montserrat', system-ui, -apple-system, 'Segoe UI', sans-serif`.
- Text: 16 px, váha 400, riadkovanie ~1.55, farba čierna.
- **Nadpisy: VEĽKÉ PÍSMENÁ, váha 900**, riadkovanie ~1.0. H1 ~55 px, H2 ~41 px (na mobile menej, `clamp`).
- Časť nadpisu zvýraznená kobaltovou (napr. „Kvalitné granule, <span>zdravý pes</span>“ → span `--g-kobalt`).
- Navigácia a malé tlačidlá: 12 px, váha 800–900, veľké písmená, `letter-spacing: 0.03em`.

## Tvary a prvky

- **Žiadne zaoblené rohy** (`border-radius: 0` všade).
- Rámiky **1.6 px solid čierna**.
- Tieň iba „posunutý blok“: `box-shadow: 10px 10px 0 var(--g-oranz)` (bez rozmazania) – na hlavnú kartu výsledku.
- **Hlavné tlačidlo:** pozadie `--g-oranz`, čierny text, rámik 1.6 px čierny, padding 14px 26px, 16 px, váha 900, veľké písmená, šípka „→“ na konci.
- **Sekundárne tlačidlo:** pozadie `--g-kobalt`, text `--g-mlieko`, rámik kobaltový.
- **Odznak / štítok:** pozadie `--g-mlieko-light`, čierny rámik, veľké písmená, váha 800 (napr. „Vyrobené na Slovensku“); limetkový štítok mierne pootočený (`rotate(-4deg)`).
- **Logo:** text „GRANULA!“, Montserrat 900 italic ~34 px, čierny text na oranžovom obdĺžniku, padding 6px 11px 5px, pootočené `rotate(-4deg)`.
- Ozdoba: oranžová „hviezdička“ (6-ramenná, z troch zaoblených obdĺžnikov) pri nadpisoch – SVG:
  `<svg viewBox="-52 -52 104 104"><g fill="#FF6900"><rect x="-50" y="-15" width="100" height="30" rx="15" transform="rotate(90)"/><rect x="-50" y="-15" width="100" height="30" rx="15" transform="rotate(30)"/><rect x="-50" y="-15" width="100" height="30" rx="15" transform="rotate(150)"/></g></svg>`
- Okraje stránky: `--gutter: clamp(16px, 4vw, 64px)`.
- Horný pás: čierny, biely text 12 px veľkými písmenami.

## Farby hodnotenia zložiek (semafor)

Oranžová značky (#FF6900) **sa nesmie zameniť** s oranžovou „pozor“. Preto:

| Pásmo | Farba pozadia | Text |
|---|---|---|
| zelená 90–100 | `#2E9D57` | biely |
| žltá 70–89 | `#F5C518` | čierny |
| oranžová 50–69 | `#E8892B` | čierny |
| červená 0–49 | `#C8322B` | biely |
| šedá (neznáme) | `#BDB6AE` | čierny |

- Farebný štítok má vždy aj **text** (napr. „Zelená · 100“) – farba nikdy nie je jediná informácia.
- Štítky sú hranaté s čiernym rámikom 1.6 px, rovnako ako ostatné prvky.
- Na stránkach s výsledkom použiť ako hlavné tlačidlo **kobaltové** (nie oranžové), aby sa nemiešalo s hodnotením.

## Tón

Rovnaký ako granula.sk: krátke vety, tykanie, priamy jazyk. Výsledky analýzy však ostávajú vecné a neutrálne (bez emócií a bez reklamy v hodnotení).
