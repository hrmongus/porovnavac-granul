// Analytické zložky a energia krmiva (docs/ANALYZER_V2.md, bod 6).
import { deacc } from '../scoring/rules';

export interface Analytical {
  protein: number;
  fat: number;
  ash: number | null;
  fiber: number | null;
  moisture: number | null;
}

const num = (s: string) => parseFloat(s.replace(/\s/g, '').replace(',', '.'));

/** Vytiahne bielkoviny, tuk, popol, vlákninu a vlhkosť (%) z textu „Analytické zložky“. */
export function parseAnalytical(raw: string | null | undefined): Analytical | null {
  if (!raw) return null;
  const t = deacc(raw);
  const g = (rx: string): number | null => {
    const m = t.match(new RegExp(`(?:${rx})[^0-9;]{0,25}(\\d+(?:[.,]\\d+)?)\\s*%`));
    return m ? num(m[1]) : null;
  };
  const protein = g('bielkov|protein|dusik');
  const fat = g('tuk|fat|oleje');
  if (protein === null || fat === null) return null;
  return { protein, fat, ash: g('popol|popel|ash'), fiber: g('vlakn|fib'), moisture: g('vlhk|voda|moist') };
}

/** Energia krmiva v kcal/100 g: uvedená výrobcom, inak odhad (modifikované Atwaterove faktory, NRC 2006). */
export function energyPer100g(energyRaw: string | null | undefined, a: Analytical | null): { kcal: number; estimated: boolean } | null {
  if (energyRaw) {
    const t = deacc(energyRaw).replace(/(\d)\s+(\d{3})/g, '$1$2');
    let m = t.match(/(\d+(?:[.,]\d+)?)\s*kcal\s*\/\s*kg/);
    if (m) return { kcal: num(m[1]) / 10, estimated: false };
    m = t.match(/(\d+(?:[.,]\d+)?)\s*kcal\s*\/\s*100\s*g/);
    if (m) return { kcal: num(m[1]), estimated: false };
    m = t.match(/(\d+(?:[.,]\d+)?)\s*mj\s*\/\s*kg/);
    if (m) return { kcal: (num(m[1]) * 239) / 10, estimated: false };
  }
  if (!a || a.ash === null || a.fiber === null) return null;
  const moisture = a.moisture ?? 10;
  const nfe = 100 - a.protein - a.fat - a.ash - a.fiber - moisture;
  if (nfe < 0) return null;
  return { kcal: 3.5 * a.protein + 8.5 * a.fat + 3.5 * nfe, estimated: true };
}
