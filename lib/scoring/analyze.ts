// Analýza zloženia – presný prepis reference/scoring.py (metodika 2.0). Deterministická, bez AI.
import { classify, colorOf, deacc, ruleText, stripChars, type Classified, type Color } from './rules';

export const METHODOLOGY_VERSION = '2.0';
const PARTS = { quality: 0.55, meat: 0.2, processing: 0.1, transparency: 0.15 };
const MEAT_FORMS = ['-cerstve', '-susene', '-maso', '-vnutor']; // len pomenované mäso a vnútornosti
const PROCESSED_SUFFIX = ['-muck', '-bielkov', '-hydrolyz'];
const PROCESSED_KEYS = new Set([
  'zivocisne-vedlajsie-produkty', 'maso-nespecifikovane', 'hydrolyzat-nespecifikovany', 'ryby-vedlajsie-produkty',
  'pekarenske-vyrobky', 'rastlinne-vedlajsie-produkty', 'cukor', 'kukuricny-lepok', 'psenicny-lepok',
  'rastlinne-proteiny', 'hrachove-frakcie', 'skrob', 'celuloza', 'rastlinna-bielkovina-nespec', 'autolyzat',
  'tuk-zvysky', 'glycerin',
]);
const WEIGHTS = [30, 20, 15, 10, 8]; // váhy 1.–5. zložky
const REST_WEIGHT = 17; // zvyšok sa delí rovnomerne medzi ostatné zložky
const ARTIFICIAL = new Set(['farbiva', 'syntet-konzervanty', 'cukor']);

/** Zložka z databázy (tabuľka ingredients). */
export interface DbIngredient {
  slug: string;
  name_sk: string;
  score: number | null;
  category: string | null;
  classification: string | null;
  sensitivity_flags: string[] | null;
  what_it_is: string | null;
}

/** alias (lowercase zápis z etikety) → zložka */
export type AliasMap = Map<string, DbIngredient>;

export interface AnalyzedItem {
  position: number;
  raw: string;
  percent: number | null;
  key: string | null;
  name: string | null;
  category: string | null;
  classification: string | null;
  score: number | null;
  color: Color;
  explanation: string;
  sensitivity: string | null;
  source: 'databaza' | 'pravidla' | 'neznama';
}

export interface AnalysisResult {
  methodology_version: string;
  items: AnalyzedItem[];
  score: number | null;
  verdict: string | null;
  caps: string[];
  unknown_items: string[];
  /** Ukazovatele metodiky 2.0 (null, ak sa nedá nič vyhodnotiť). */
  parts: ScoreParts | null;
}

export interface ScoreParts {
  quality: number;          // kvalita surovín 0–100
  meat_pct: number | null;  // odhad % mäsa v hotových granulách; null = výrobca neuvádza
  meat: number;             // body za mäso 0–100
  processed_pct: number;    // váhový podiel vysoko spracovaných surovín (%)
  processing: number;       // body za spracovanosť 0–100
  transparency: number;     // transparentnosť 0–100
}

/** Rozdelí text podľa čiarok/bodkočiarok mimo zátvoriek; desatinná čiarka (2,5) sa nedelí. */
export function splitTop(s: string): string[] {
  const out: string[] = [];
  let buf = '';
  let d = 0;
  const isDigit = (c: string | undefined) => c !== undefined && /\d/.test(c);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(' || ch === '[') d += 1;
    else if (ch === ')' || ch === ']') d = Math.max(0, d - 1);
    if ((ch === ',' || ch === ';') && d === 0 && !(i > 0 && i < s.length - 1 && isDigit(s[i - 1]) && isDigit(s[i + 1]))) {
      out.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  out.push(buf);
  return out.map((x) => stripChars(x, ' .*')).filter((x) => x.length > 0);
}

/** Kľúč pre vyhľadanie v ingredient_aliases: lowercase, bez zátvoriek a dávok/percent. */
export function aliasKey(raw: string): string {
  let t = stripChars(raw.replace(/\([^)]*\)|\[[^\]]*\]/g, '').toLowerCase(), ' .,:;*');
  t = t.replace(/\d+([.,]\d+)?\s*(%|mg\/kg|g\/kg|mg|iu|ie|m\.j\.)/g, '').trim();
  return t.replace(/\s+/g, ' ');
}

function fromDb(ing: DbIngredient): Classified {
  return {
    key: ing.slug, name: ing.name_sk, category: ing.category, classification: ing.classification,
    score: ing.score, color: colorOf(ing.score), explanation: ing.what_it_is ?? '',
    sensitivity: ing.sensitivity_flags?.[0] ?? null,
  };
}

export function verdictOf(score: number): string {
  return score >= 90 ? 'Výborné zloženie' : score >= 70 ? 'Kvalitné zloženie'
    : score >= 50 ? 'Slabšia kvalita zloženia' : 'Nekvalitné zloženie';
}

/** Ako Python 3.12+ sum() pre floaty (Neumaierova kompenzovaná suma) – kvôli zhode na poslednom bite. */
function pySum(xs: number[]): number {
  let sum = 0;
  let c = 0;
  for (const x of xs) {
    const t = sum + x;
    if (Math.abs(sum) >= Math.abs(x)) c += sum - t + x;
    else c += x - t + sum;
    sum = t;
  }
  return sum + c;
}

/** Python round() = zaokrúhlenie na párne pri .5 (banker's rounding). */
function pyRound(x: number): number {
  const f = Math.floor(x);
  if (x - f === 0.5) return f % 2 === 0 ? f : f + 1;
  return Math.round(x);
}

export function analyze(composition: string, aliases?: AliasMap): AnalysisResult {
  const items: AnalyzedItem[] = [];
  for (const raw of splitTop(composition || '')) {
    if (ruleText(raw) === null) continue; // zvyšok po spracovaní textu (nadpis, hmotnosť…)
    const db = aliases?.get(aliasKey(raw));
    const c = db ? fromDb(db) : classify(raw);
    if (c === null) continue;
    const m = raw.match(/(\d+(?:[.,]\d+)?)\s*%/);
    items.push({
      position: items.length + 1,
      raw,
      percent: m ? parseFloat(m[1].replace(',', '.')) : null,
      ...c,
      source: db ? 'databaza' : c.score === null ? 'neznama' : 'pravidla',
    });
  }
  const unknown_items = items.filter((it) => it.score === null).map((it) => it.raw);
  const scored = items.filter((it) => it.score !== null);
  const base = { methodology_version: METHODOLOGY_VERSION, items, unknown_items };
  if (scored.length === 0) return { ...base, score: null, verdict: null, caps: [], parts: null };

  const w = positionWeights(scored.length);
  const quality = pySum(scored.map((it, i) => w[i] * (it.score as number))) / pySum(w);
  const meat_pct = meatEstimate(scored);
  const processed_pct = processedShare(scored, w);
  const transp = transparency(scored);
  const meatPts = meat_pct === null ? 30 : Math.min(100, meat_pct * 2);
  const procPts = Math.max(0, 100 - 2 * processed_pct);
  let score = PARTS.quality * quality + PARTS.meat * meatPts + PARTS.processing * procPts + PARTS.transparency * transp;
  const caps: string[] = [];
  if (scored.slice(0, 5).some((it) => it.color === 'cervena')) {
    score = Math.min(score, 49);
    caps.push('červená zložka medzi prvými piatimi → max. 49');
  }
  if (scored.some((it) => it.key !== null && ARTIFICIAL.has(it.key))) {
    score = Math.min(score, 69);
    caps.push('umelé farbivo, syntetický konzervant alebo cukor → max. 69');
  }
  const rounded = pyRound(score);
  const parts: ScoreParts = {
    quality: pyRound(quality), meat_pct, meat: meatPts, processed_pct, processing: procPts, transparency: transp,
  };
  return { ...base, score: rounded, verdict: verdictOf(rounded), caps, parts };
}

function positionWeights(n: number): number[] {
  const rest = REST_WEIGHT / Math.max(1, n - WEIGHTS.length);
  return Array.from({ length: n }, (_, i) => (i < WEIGHTS.length ? WEIGHTS[i] : rest));
}

/** Odhad % mäsa v hotových granulách z deklarovaných percent a formy (čerstvé ~75 % vody, ostatné ~10 %). */
function meatEstimate(scored: AnalyzedItem[]): number | null {
  let fresh = 0;
  let dry = 0;
  let anyPct = false;
  for (const it of scored) {
    const k = it.key ?? '';
    if (!MEAT_FORMS.some((f) => k.endsWith(f))) continue;
    const raw = deacc(it.raw);
    const inner = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*%\s*([a-z ]*?)(susen|dehydr|cerstv)/g)];
    if (inner.length > 0) {
      for (const m of inner) {
        const v = parseFloat(m[1].replace(',', '.'));
        anyPct = true;
        if (m[3] === 'cerstv' && !raw.includes('susenom stave')) fresh += v;
        else dry += v;
      }
      continue;
    }
    if (it.percent === null) continue;
    anyPct = true;
    if (k.endsWith('-cerstve') && !raw.includes('susenom stave')) fresh += it.percent;
    else dry += it.percent;
  }
  if (!anyPct) return null;
  fresh = Math.min(fresh, 100); // nadradené + vnorené percentá nesmú presiahnuť 100
  dry = Math.min(dry, 100 - fresh);
  const totalDry = fresh * 0.25 + (100 - fresh) * 0.9;
  return Math.max(0, Math.min(100, pyRound((100 * (fresh * 0.25 + dry * 0.9)) / totalDry)));
}

function processedShare(scored: AnalyzedItem[], w: number[]): number {
  const p = pySum(scored.flatMap((it, i) => {
    const k = it.key ?? '';
    return PROCESSED_SUFFIX.some((s) => k.endsWith(s)) || PROCESSED_KEYS.has(k) ? [w[i]] : [];
  }));
  return pyRound((100 * p) / pySum(w));
}

function transparency(scored: AnalyzedItem[]): number {
  const top = scored.slice(0, 10);
  const named = top.filter((it) => it.classification === 'pomenovana').length / top.length;
  const top3 = top.slice(0, 3).filter((it) => it.percent !== null).length / Math.min(3, top.length);
  return pyRound(100 * (0.6 * named + 0.4 * top3));
}

/** Odhad sacharidov (NBE, %) z analytických zložiek – len informácia, nehodnotí sa. */
export function carbsEstimate(analytical: string | null | undefined): number | null {
  if (!analytical) return null;
  const t = deacc(analytical);
  const g = (rx: string): number | null => {
    const m = t.match(new RegExp(rx + '[^0-9]{0,25}(\\d+(?:[.,]\\d+)?)\\s*%'));
    return m ? parseFloat(m[m.length - 1].replace(',', '.')) : null;
  };
  const p = g('(bielkov|protein|dusik)');
  const f = g('(tuk|fat)');
  const a = g('(popol|popel|ash)');
  const fi = g('(vlakn|fib)');
  const mo = g('(vlhk|voda|moist)');
  if (p === null || f === null || a === null || fi === null) return null;
  return pyRound((100 - p - f - a - fi - (mo ?? 10)) * 10) / 10; // ako Python round(x, 1)
}
