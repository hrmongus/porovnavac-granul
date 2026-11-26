// Výsledok analyzéra 2.0 (docs/ANALYZER_V2.md, body 4–6): ako sedí psovi, dávka, hlavné zistenia, ukazovatele.
// Deterministické pravidlá, bez AI. Hodnotenie zloženia samotné je v lib/scoring/analyze.ts.
import type { AnalysisResult, AnalyzedItem } from '../scoring/analyze';
import { deacc } from '../scoring/rules';
import { compute, dailyKcal, type DogAnswers } from '../dog/engine';
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

export interface Indicator { key: 'quality' | 'meat' | 'processing' | 'transparency'; label: string; points: number; word: string; text: string }

export type FitLevel = 'vyborne' | 'vyhrady' | 'skor-nie' | 'nie';
/** Dôvod s odpočtom (cap = strop pri alergii); info = bez odpočtu (napr. chýbajú analytické zložky). */
export interface FitReason { text: string; points: number; cap?: number; info?: boolean; health?: boolean }
export interface Fit { score: number; level: FitLevel; title: string; reasons: FitReason[]; vetNote: boolean }

export const FIT_TITLES: Record<FitLevel, string> = {
  vyborne: 'Hodí sa výborne', vyhrady: 'Hodí sa s výhradami', 'skor-nie': 'Skôr sa nehodí', nie: 'Nehodí sa',
};
export const fitLevelOf = (score: number): FitLevel => (score >= 85 ? 'vyborne' : score >= 65 ? 'vyhrady' : score >= 40 ? 'skor-nie' : 'nie');

export const ALLERGENS: { id: string; label: string; rx: RegExp }[] = [
  { id: 'kuracie', label: 'kuracie', rx: /kurac|kurat|kura\b|kure|kurec|kurc|chicken/ },
  { id: 'hovadzie', label: 'hovädzie', rx: /hovad|hovez|beef|telac|telec/ },
  { id: 'bravcove', label: 'bravčové', rx: /bravc|vepr|pork/ },
  { id: 'morka', label: 'morčacie', rx: /morc|morka|morky|kruti|krocan|turkey/ },
  { id: 'kacica', label: 'kačacie', rx: /kacac|kacic|kacka|kachn|duck/ },
  { id: 'hus', label: 'husacie', rx: /husac|husi\b|hus\b|goose/ },
  { id: 'jahna', label: 'jahňacie', rx: /jahn|jehne|lamb|ovci|ovc/ },
  { id: 'jelen', label: 'jelenie', rx: /jelen|venison/ },
  { id: 'kralik', label: 'králičie', rx: /kral|rabbit/ },
  { id: 'ryby', label: 'ryby', rx: /\bryb|losos|sled|tresk|tuniak|sardin|makrel|pstruh|platesa|kapor|fish|salmon|herring/ },
  { id: 'vajcia', label: 'vajcia', rx: /vajc|vajec|\begg/ },
  { id: 'ryza', label: 'ryžu', rx: /ryz|rice/ },
  { id: 'zemiaky', label: 'zemiaky', rx: /^(?!.*sladk).*(zemiak|brambor|potato)/ },
  { id: 'psenica', label: 'pšenicu', rx: /psenic|wheat/ },
  { id: 'kukurica', label: 'kukuricu', rx: /kukuric|corn\b|maize/ },
  { id: 'soja', label: 'sóju', rx: /\bsoj|soya|soy\b/ },
];
const POULTRY = new Set(['kuracie', 'morka', 'kacica', 'hus']);
const SPECIES = ALLERGENS.filter((a) => !['ryza', 'zemiaky', 'psenica', 'kukurica', 'soja', 'vajcia'].includes(a.id));

const WORDS = (p: number) => (p >= 90 ? 'Výborné' : p >= 70 ? 'Dobré' : p >= 50 ? 'Priemer' : 'Slabé');
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const itemText = (it: AnalyzedItem) => deacc(`${it.raw} ${it.name ?? ''}`);
const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

function stageOfProduct(p: ProductInfo): 'puppy' | 'adult' | 'senior' | null {
  const ls = p.life_stage;
  if (ls === 'stena') return 'puppy';
  if (ls === 'dospely') return 'adult';
  if (ls === 'senior') return 'senior';
  if (ls === 'vsetky') return null;
  const n = deacc(p.name);
  if (/puppy|junior|stena|steniat|stenat|stene\b|starter/.test(n)) return 'puppy';
  if (/senior|mature|aging/.test(n)) return 'senior';
  if (/adult|dospel/.test(n)) return 'adult';
  return null;
}

function sizeOfProduct(p: ProductInfo): 'small' | 'medium' | 'large' | null {
  const n = deacc(p.name);
  if (/\bmini\b|\bsmall\b|\btoy\b|\bx-?small\b/.test(n)) return 'small';
  if (/\bmaxi\b|\blarge\b|\bgiant\b/.test(n)) return 'large';
  if (/\bmedium\b/.test(n)) return 'medium';
  return null;
}

/**
 * Ako sa krmivo hodí pre psa – skóre 0–100 (docs/ANALYZER_V2.md, bod 5).
 * Rovnaké pravidlá pre každé krmivo vrátane receptúr Granula. Fáza a veľkosť psa z engine.js (derive).
 */
export function fitForDog(r: AnalysisResult, dog: DogAnswers, product: ProductInfo | null): Fit {
  const d = compute(dog).derived;
  const name = dog.dogname || 'pes';
  const items = r.items;
  const reasons: FitReason[] = [];

  // Alergia → strop 20
  for (const id of dog.allergies) {
    const al = ALLERGENS.find((a) => a.id === id);
    if (!al) continue;
    const hit = items.find((it) => al.rx.test(itemText(it)));
    if (hit) reasons.push({ text: `Obsahuje ${al.label} (${lower(hit.raw)}) – ${name} naň nemusí reagovať dobre.`, points: 80, cap: 20, health: true });
    else if (POULTRY.has(id)) {
      const poultry = items.find((it) => /hydin|drub|poultry/.test(itemText(it)));
      if (poultry) reasons.push({ text: `Obsahuje hydinu bez uvedenia druhu (${lower(poultry.raw)}) – ${al.label} sa nedá vylúčiť.`, points: 80, cap: 20, health: true });
    }
  }

  // Fáza a veľkosť
  if (product) {
    const ps = stageOfProduct(product);
    if (d.isPuppy && (ps === 'adult' || ps === 'senior')) reasons.push({ text: 'Krmivo nie je určené pre šteňatá v raste.', points: 30 });
    if (!d.isPuppy && ps === 'puppy') reasons.push({ text: `Krmivo je pre šteňatá, ${name} je ${d.stage === 'senior' ? 'senior' : 'dospelý'}.`, points: 15 });
    const pz = sizeOfProduct(product);
    const dogSmall = d.small;
    if ((pz === 'small' && (d.largeGiant || d.size === 'stredne')) || (pz === 'large' && dogSmall) || (pz === 'medium' && (dogSmall || d.size === 'obrie'))) {
      reasons.push({ text: `Krmivo je výslovne pre ${pz === 'small' ? 'malé' : pz === 'large' ? 'veľké' : 'stredné'} plemená.`, points: 10 });
    }
  }

  // Tuk a bielkoviny (len ak ich výrobca uvádza)
  const a = parseAnalytical(product?.analytical_raw);
  const lowActivity = dog.activity === 'doma' || d.stage === 'senior';
  const fatRelevant = d.pancreas || d.obese || dog.focus.includes('vaha') || d.active || lowActivity;
  if (a) {
    if (d.pancreas && a.fat > 18) reasons.push({ text: `Má ${fmt(a.fat)} % tuku. Pri problémoch s pankreasom sa poraď s veterinárom.`, points: 40, health: true });
    else if (d.pancreas && a.fat > 14) reasons.push({ text: `Má ${fmt(a.fat)} % tuku. Pri problémoch s pankreasom sa poraď s veterinárom.`, points: 30, health: true });
    if ((d.obese || dog.focus.includes('vaha')) && a.fat >= 16) reasons.push({ text: `Má ${fmt(a.fat)} % tuku – na chudnutie je to veľa.`, points: 20, health: true });
    if (d.active && a.protein < 24) reasons.push({ text: `Pre aktívneho psa má málo bielkovín (${fmt(a.protein)} %).`, points: 15 });
    if (d.active && a.fat < 14) reasons.push({ text: `Pre aktívneho psa má málo tuku (${fmt(a.fat)} %).`, points: 10 });
    if (lowActivity && !d.active && a.fat >= 18) reasons.push({ text: `Má ${fmt(a.fat)} % tuku – pri malom pohybe je to veľa.`, points: 10 });
  } else if (fatRelevant) {
    reasons.push({ text: 'Obsah tuku výrobca neuvádza – nevieme posúdiť.', points: 0, info: true });
  }

  // Citlivé trávenie, „nesedí mu každé mäso“
  if (dog.focus.includes('travenie') || dog.focus.includes('alergia')) {
    const species = SPECIES.filter((s) => items.some((it) => s.rx.test(itemText(it)))).length;
    const cheapTop5 = items.slice(0, 5).find((it) => /psenic|wheat|kukuric|corn\b|maize|\bsoj|soy/.test(itemText(it)));
    if (species >= 3) reasons.push({ text: `Obsahuje ${species} druhy živočíšnych surovín – pri citlivom trávení býva lepšie menej.`, points: 15, health: true });
    if (cheapTop5) reasons.push({ text: `Medzi prvými piatimi zložkami je ${lower(cheapTop5.raw)} – pri citlivom trávení častý problém.`, points: 10, health: true });
  }

  // Kĺby
  if (dog.focus.includes('kby') || d.largeGiant || d.stage === 'senior') {
    const all = deacc(`${items.map((it) => it.raw).join(' ')} ${product?.additives_raw ?? ''} ${product?.analytical_raw ?? ''}`);
    if (!/glukozamin|glucosamin|glukosamin|chondroitin/.test(all)) reasons.push({ text: 'Neobsahuje glukozamín ani chondroitín na podporu kĺbov.', points: 5 });
  }

  let score = 100 - reasons.reduce((s, x) => s + (x.cap ? 0 : x.points), 0);
  const caps = reasons.filter((x) => x.cap !== undefined).map((x) => x.cap as number);
  if (caps.length) score = Math.min(score, ...caps);
  score = Math.max(0, score);
  const level = fitLevelOf(score);
  const shown = reasons.filter((x) => !x.info).sort((x, y) => (y.cap !== undefined ? 1000 : y.points) - (x.cap !== undefined ? 1000 : x.points)).slice(0, 3);
  const info = reasons.filter((x) => x.info);
  return { score, level, title: FIT_TITLES[level], reasons: [...shown, ...info].slice(0, 3), vetNote: reasons.some((x) => x.health) };
}

/** Denná dávka v gramoch: energia krmiva (výrobca alebo metabolizable()) a potreba psa z engine.js. */
export function doseFor(dog: DogAnswers, product: ProductInfo | null): { grams: number; estimatedEnergy: boolean } | null {
  if (!product) return null;
  const e = energyPer100g(product.energy_raw, parseAnalytical(product.analytical_raw));
  if (!e || e.kcal < 150 || e.kcal > 700) return null;
  const grams = (dailyKcal(dog) / e.kcal) * 100;
  return { grams: Math.max(5, Math.round(grams / 5) * 5), estimatedEnergy: e.estimated };
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
