import type { AnalysisResult, AnalyzedItem } from './scoring/analyze';
import type { Color } from './scoring/rules';

/** Uložený výsledok (analyses.result). */
export interface StoredResult extends AnalysisResult {
  percentile: number | null; // „lepšie ako X % granúl“
  market_count: number;
}

export const FREE_EXPLANATIONS = 3;

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

export interface ViewItem extends Omit<AnalyzedItem, 'explanation'> {
  explanation: string | null; // null = skryté (brána e-mailu)
}

export interface ResultView extends Omit<StoredResult, 'items'> {
  items: ViewItem[];
  locked: boolean;
}

/** Verzia pre obrazovku zadarmo: vysvetlenie len pri prvých 3 zložkách, percentil skrytý. */
export function toView(r: StoredResult, unlocked: boolean): ResultView {
  return {
    ...r,
    percentile: unlocked ? r.percentile : null,
    locked: !unlocked,
    items: r.items.map((it, i) => ({
      ...it,
      explanation: unlocked || i < FREE_EXPLANATIONS ? it.explanation : null,
    })),
  };
}

export function sensitivityNote(s: string | null, explanation?: string | null): string | null {
  if (explanation && /alerg/i.test(explanation)) return null; // vysvetlenie to už uvádza
  if (s === 'kuracie') return 'Patrí medzi častejšie alergény.';
  return null;
}
