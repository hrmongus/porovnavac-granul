import type { AnalysisResult } from './scoring/analyze';
import type { Color } from './scoring/rules';
import type { Fit, Indicator } from './v2/report';
import type { GranulaPick } from './v2/granula';

/** Uložený výsledok (analyses.result). Polia z analyzéra 2.0 sú voliteľné kvôli starším analýzam. */
export interface StoredResult extends AnalysisResult {
  percentile: number | null; // „lepšie ako X % granúl“
  market_count: number;
  product?: { brand: string; name: string; composition_date: string | null; source: string | null } | null;
  fit?: Fit;
  granula?: GranulaPick;
  dose?: { grams: number; estimatedEnergy: boolean } | null;
  findings?: { good: string[]; bad: string[] };
  indicators?: Indicator[];
  carbs?: number | null;
  market_meat_median?: number | null;
}

export const COLOR_NAME: Record<Color, string> = {
  zelena: 'Zelená',
  zlta: 'Žltá',
  oranzova: 'Oranžová',
  cervena: 'Červená',
  seda: 'Šedá',
};

/** Text štítku – farba nikdy nie je jediná informácia, napr. „Zelená · 100“. */
export function chipText(color: Color, score: number | null): string {
  return score === null ? `${COLOR_NAME[color]} · neznáma` : `${COLOR_NAME[color]} · ${score}`;
}

export const COLOR_LEGEND: { color: Color; range: string; text: string }[] = [
  { color: 'zelena', range: '90–100', text: 'Čistá, konkrétne pomenovaná a výživovo hodnotná zložka' },
  { color: 'zlta', range: '70–89', text: 'Stále kvalitná zložka' },
  { color: 'oranzova', range: '50–69', text: 'Pri tejto zložke je dobré spozornieť (lacné plnivo, frakcia, škrob…)' },
  { color: 'cervena', range: '0–49', text: 'Nejasný pôvod, umelá prísada alebo zložka, ktorá v kvalitnom krmive nemá čo hľadať' },
  { color: 'seda', range: '–', text: 'Zložku zatiaľ nepoznáme; nehodnotí sa a doplníme ju' },
];

export function sensitivityNote(s: string | null, explanation?: string | null): string | null {
  if (explanation && /alerg/i.test(explanation)) return null; // vysvetlenie to už uvádza
  if (s === 'kuracie') return 'Patrí medzi častejšie alergény.';
  return null;
}
