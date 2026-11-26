// Výsledok analyzéra 2.0 (docs/ANALYZER_V2.md, body 4–6): ako sedí psovi, dávka, hlavné zistenia, ukazovatele.
// Deterministické pravidlá, bez AI. Hodnotenie zloženia samotné je v lib/scoring/analyze.ts.
import type { AnalysisResult, AnalyzedItem } from '../scoring/analyze';
import { deacc } from '../scoring/rules';
import { dailyKcal, derive, PARAMS, type DogAnswers } from '../dog/engine';
import { energyPer100g, parseAnalytical } from './nutrition';

/** Údaje o vybranom produkte z databázy (pri texte/fotke null). */
export interface ProductInfo {
  brand: string;
  name: string;
  composition_date: string | null;
  source_url: string | null;
  analytical_raw: string | null;
  energy_raw: string | null;
  life_stage: string | null;
  additives_raw: string | null;
}

export type FitLevel = 'ok' | 'warn' | 'no';
export interface FitReason { level: FitLevel | 'plus'; text: string }
export interface Fit { level: FitLevel; title: string; reasons: FitReason[]; vetNote: boolean }

export interface Indicator { key: 'quality' | 'meat' | 'processing' | 'transparency'; label: string; points: number; word: string; text: string }

export const ALLERGENS: { id: string; label: string; rx: RegExp }[] = [
  { id: 'kuracie', label: 'kuracie', rx: /kurac|kurat|kura\b|kure|kurec|kurc|chicken/ },
  { id: 'hovadzie', label: 'hovädzie', rx: /hovad|hovez|beef|telac|telec/ },
  { id: 'bravcove', label: 'bravčové', rx: /bravc|vepr|pork/ },
  { id: 'morka', label: 'morka', rx: /morc|morka|morky|kruti|krocan|turkey/ },
  { id: 'kacica', label: 'kačica', rx: /kacac|kacic|kacka|kachn|duck/ },
  { id: 'hus', label: 'hus', rx: /husac|husi\b|hus\b|goose/ },
  { id: 'jahna', label: 'jahňacie', rx: /jahn|jehne|lamb|ovci|ovc/ },
  { id: 'jelen', label: 'jeleň', rx: /jelen|venison/ },
  { id: 'kralik', label: 'králik', rx: /kral|rabbit/ },
  { id: 'ryby', label: 'ryby', rx: /\bryb|losos|sled|tresk|tuniak|sardin|makrel|pstruh|platesa|kapor|fish|salmon|herring/ },
  { id: 'vajcia', label: 'vajcia', rx: /vajc|vajec|\begg/ },
  { id: 'ryza', label: 'ryža', rx: /ryz|rice/ },
  { id: 'zemiaky', label: 'zemiaky', rx: /^(?!.*sladk).*(zemiak|brambor|potato)/ },
  { id: 'psenica', label: 'pšenica', rx: /psenic|wheat/ },
  { id: 'kukurica', label: 'kukurica', rx: /kukuric|corn\b|maize/ },
  { id: 'soja', label: 'sója', rx: /\bsoj|soya|soy\b/ },
];
const POULTRY = new Set(['kuracie', 'morka', 'kacica', 'hus']);
const SPECIES = ALLERGENS.filter((a) => !['ryza', 'zemiaky', 'psenica', 'kukurica', 'soja', 'vajcia'].includes(a.id));

const WORDS = (p: number) => (p >= 90 ? 'Výborné' : p >= 70 ? 'Dobré' : p >= 50 ? 'Priemer' : 'Slabé');
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Text položky bez obsahu zátvoriek? Nie – alergény sa hľadajú aj v zátvorkách (napr. „tuk (z kuracieho)“). */
const itemText = (it: AnalyzedItem) => deacc(`${it.raw} ${it.name ?? ''}`);

function stageOfProduct(p: ProductInfo): 'puppy' | 'adult' | 'senior' | null {
  const n = deacc(`${p.name} ${p.life_stage ?? ''}`);
  if (/puppy|junior|stena|steniat|stenat|starter|\bstena\b/.test(n)) return 'puppy';
  if (/senior|mature|\b7\+|\b8\+|aging/.test(n)) return 'senior';
  if (/adult|dospel/.test(n)) return 'adult';
  return null;
}

function sizeOfProduct(p: ProductInfo): 'small' | 'medium' | 'large' | null {
  const n = deacc(p.name);
  if (/\bmini\b|\bsmall\b|\btoy\b|\bx-?small\b|male plemena|malych plemien/.test(n)) return 'small';
  if (/\bmaxi\b|\blarge\b|\bgiant\b|\bxl\b|velke plemena|velkych plemien/.test(n)) return 'large';
  if (/\bmedium\b|stredne plemena|strednych plemien/.test(n)) return 'medium';
  return null;
}

export function fitForDog(r: AnalysisResult, dog: DogAnswers, product: ProductInfo | null): Fit {
  const d = derive(dog);
  const reasons: FitReason[] = [];
  let vetNote = false;
  const items = r.items;

  // Alergie
  for (const id of dog.allergies) {
    const al = ALLERGENS.find((a) => a.id === id);
    if (!al) continue;
    const hit = items.find((it) => al.rx.test(itemText(it)));
    if (hit) {
      reasons.push({ level: 'no', text: `Obsahuje ${al.label} (${lower(hit.raw)}).` });
      vetNote = true;
    } else if (POULTRY.has(id)) {
      const poultry = items.find((it) => /hydin|drub|poultry/.test(itemText(it)));
      if (poultry) {
        reasons.push({ level: 'warn', text: `Obsahuje hydinu bez uvedenia druhu (${lower(poultry.raw)}) – ${al.label} sa nedá vylúčiť.` });
        vetNote = true;
      }
    }
  }

  // Životná fáza a veľkosť (podľa názvu produktu)
  if (product) {
    const ps = stageOfProduct(product);
    const dogStage = d.isPuppy ? 'puppy' : d.stage === 'senior' ? 'senior' : 'adult';
    if (ps && ps !== dogStage && !(ps === 'adult' && dogStage === 'senior')) {
      const names = { puppy: 'šteňatá', adult: 'dospelých psov', senior: 'seniorov' } as const;
      reasons.push({ level: 'warn', text: `Krmivo je určené pre ${names[ps]}, ${dog.name || 'tvoj pes'} je ${dogStage === 'puppy' ? 'šteňa' : dogStage === 'senior' ? 'senior' : 'dospelý'}.` });
    }
    const pz = sizeOfProduct(product);
    if (pz === 'small' && d.largeGiant) reasons.push({ level: 'warn', text: 'Krmivo je pre malé plemená, granula môže byť pre veľkého psa malá.' });
    if (pz === 'large' && d.small) reasons.push({ level: 'warn', text: 'Krmivo je pre veľké plemená, granula môže byť pre malého psa veľká.' });
  }

  // Analytické zložky (len pri produkte z databázy)
  const a = parseAnalytical(product?.analytical_raw);
  if (a) {
    if (dog.focus.includes('pankreas') && a.fat > 14) {
      reasons.push({ level: 'warn', text: `Má ${fmt(a.fat)} % tuku. Pri problémoch s pankreasom sa poraď s veterinárom.` });
      vetNote = true;
    }
    if ((d.obese || dog.focus.includes('vaha')) && a.fat >= 16) {
      reasons.push({ level: 'warn', text: `Má ${fmt(a.fat)} % tuku – na chudnutie je to veľa.` });
      vetNote = true;
    }
    if (d.active && (a.protein < 24 || a.fat < 14)) {
      reasons.push({ level: 'warn', text: `Pre aktívneho psa má málo ${a.protein < 24 ? `bielkovín (${fmt(a.protein)} %)` : `tuku (${fmt(a.fat)} %)`}.` });
    }
  }

  // Kĺby
  if (d.largeGiant || d.stage === 'senior' || dog.focus.includes('klby')) {
    const all = deacc(`${items.map((it) => it.raw).join(' ')} ${product?.additives_raw ?? ''} ${product?.analytical_raw ?? ''}`);
    if (/glukozamin|glucosamin|glukosamin|chondroitin/.test(all)) {
      reasons.push({ level: 'plus', text: 'Obsahuje glukozamín alebo chondroitín na podporu kĺbov.' });
    }
  }

  // Citlivé trávenie
  if (dog.focus.includes('travenie')) {
    const species = SPECIES.filter((s) => items.some((it) => s.rx.test(itemText(it)))).length;
    const cheapTop5 = items.slice(0, 5).find((it) => /psenic|wheat|kukuric|corn\b|maize|\bsoj|soy/.test(itemText(it)));
    if (species >= 3) reasons.push({ level: 'warn', text: `Obsahuje ${species} druhy živočíšnych surovín – pri citlivom trávení býva lepšie menej.` });
    else if (cheapTop5) reasons.push({ level: 'warn', text: `Medzi prvými piatimi zložkami je ${lower(cheapTop5.raw)} – pri citlivom trávení častý problém.` });
    if (species >= 3 || cheapTop5) vetNote = true;
  }

  const order = { no: 0, warn: 1, plus: 2, ok: 3 } as const;
  reasons.sort((x, y) => order[x.level] - order[y.level]);
  const level: FitLevel = reasons.some((x) => x.level === 'no') ? 'no' : reasons.some((x) => x.level === 'warn') ? 'warn' : 'ok';
  const title = level === 'no' ? 'Nesedí' : level === 'warn' ? 'Sedí s výhradami' : 'Sedí';
  return { level, title, reasons: reasons.slice(0, 3), vetNote };
}

const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/** Denná dávka v gramoch, ak poznáme energiu krmiva. */
export function doseFor(dog: DogAnswers, product: ProductInfo | null): { grams: number; estimatedEnergy: boolean } | null {
  if (!product || !(dog.kg > 0)) return null;
  const e = energyPer100g(product.energy_raw, parseAnalytical(product.analytical_raw));
  if (!e || e.kcal < 150 || e.kcal > 700) return null;
  const grams = (dailyKcal(dog) / e.kcal) * 100;
  return { grams: Math.max(PARAMS.roundTo, Math.round(grams / PARAMS.roundTo) * PARAMS.roundTo), estimatedEnergy: e.estimated };
}

const SHORT_REASON: Record<string, string> = {
  obilnina: 'lacný zdroj energie, nie bielkovín',
  strukovina: 'rastlinný zdroj, lacnejší ako mäso',
  zivocisny_vedlajsi_produkt: 'výrobca neuvádza, z čoho presne je',
  tuk_olej: 'tuk bez bližšieho určenia',
  prisada: 'prísada bez výživovej hodnoty pre psa',
};

/** 1 najlepšie + max. 2 najhoršie zistenia jednou vetou. */
export function findings(r: AnalysisResult, marketMeatMedian: number | null): { good: string[]; bad: string[] } {
  const p = r.parts;
  const scored = r.items.filter((it) => it.score !== null);
  const good: string[] = [];
  const bad: string[] = [];
  const med = marketMeatMedian;

  if (p?.meat_pct != null && med != null && p.meat_pct >= med + 5) {
    good.push(`Mäso tvorí odhadom ${p.meat_pct} % granúl. Bežné granule na trhu majú okolo ${med} %.`);
  }
  const first = scored[0];
  if (first && first.category === 'maso' && first.classification === 'pomenovana' && (first.score ?? 0) >= 90) {
    good.push(`Na 1. mieste je ${lower(first.name ?? first.raw)} – konkrétne pomenovaný zdroj bielkovín.`);
  }
  if (p && p.transparency >= 90) good.push('Výrobca pomenúva suroviny a uvádza percentá hlavných zložiek.');
  if (scored.length && !scored.some((it) => it.color === 'cervena')) good.push('V zložení nie je žiadna zložka s červeným hodnotením.');

  const weak = scored.slice(0, 3).find((it) => it.color === 'cervena' || it.color === 'oranzova');
  if (weak) {
    const why = SHORT_REASON[weak.category ?? ''] ?? (weak.color === 'cervena' ? 'zložka s červeným hodnotením' : 'zložka, pri ktorej je dobré spozornieť');
    bad.push(`Na ${weak.position}. mieste je ${lower(weak.name ?? weak.raw)} – ${why}.`);
  }
  if (r.items.some((it) => it.classification === 'nespecifikovana' && (it.category === 'maso' || it.category === 'zivocisny_vedlajsi_produkt'))) {
    bad.push('Výrobca neuvádza, z akého zvieraťa je mäso.');
  }
  if (r.caps.some((c) => c.includes('umelé'))) bad.push('Obsahuje umelé farbivo, syntetický konzervant alebo cukor.');
  if (p) {
    if (p.meat_pct === null) bad.push('Výrobca neuvádza percentá mäsa.');
    else if (med != null && p.meat_pct <= med - 5) bad.push(`Mäso tvorí odhadom ${p.meat_pct} % granúl, bežné granule na trhu majú okolo ${med} %.`);
    if (p.processed_pct >= 40) bad.push(`Odhadom ${p.processed_pct} % zloženia tvoria vysoko spracované suroviny.`);
  }
  return { good: good.slice(0, 1), bad: bad.slice(0, 2) };
}

export function indicators(r: AnalysisResult, marketMeatMedian: number | null): Indicator[] {
  const p = r.parts;
  if (!p) return [];
  const med = marketMeatMedian != null ? ` Medián trhu: ${marketMeatMedian} %.` : '';
  return [
    { key: 'quality', label: 'Kvalita surovín', points: p.quality, word: WORDS(p.quality),
      text: 'Priemer hodnotení zložiek – prvé zložky majú najväčšiu váhu, lebo ich je v krmive najviac.' },
    { key: 'meat', label: 'Mäso', points: p.meat, word: WORDS(p.meat),
      text: p.meat_pct === null ? 'Výrobca neuvádza percentá mäsa.' : `Mäso tvorí odhadom ${p.meat_pct} % granúl.${med}` },
    { key: 'processing', label: 'Spracovanosť', points: p.processing, word: WORDS(p.processing),
      text: `Odhadom ${p.processed_pct} % zloženia tvoria vysoko spracované suroviny (múčky, proteínové koncentráty, škroby, vedľajšie produkty).` },
    { key: 'transparency', label: 'Transparentnosť', points: p.transparency, word: WORDS(p.transparency),
      text: 'Koľko z prvých 10 zložiek je konkrétne pomenovaných a či sú pri prvých troch uvedené percentá.' },
  ];
}
