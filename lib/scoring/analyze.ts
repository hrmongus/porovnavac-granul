// Analýza zloženia – presný prepis reference/scoring.py (metodika v1.0). Deterministická, bez AI.
import { classify, colorOf, ruleText, stripChars, type Classified, type Color } from './rules';

export const METHODOLOGY_VERSION = '1.0';
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
  if (scored.length === 0) return { ...base, score: null, verdict: null, caps: [] };

  const n = scored.length;
  const rest = REST_WEIGHT / Math.max(1, n - WEIGHTS.length);
  const w = scored.map((_, i) => (i < WEIGHTS.length ? WEIGHTS[i] : rest));
  let score = pySum(scored.map((it, i) => w[i] * (it.score as number))) / pySum(w);
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
  return { ...base, score: rounded, verdict: verdictOf(rounded), caps };
}
