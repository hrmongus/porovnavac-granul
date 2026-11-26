// Analytické zložky a energia krmiva (docs/ANALYZER_V2.md, bod 6).
import { deacc } from '../scoring/rules';
import { metabolizable } from '../dog/engine';

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

/**
 * Energia krmiva v kcal/100 g: uvedená výrobcom, inak rovnaký výpočet ako konfigurátor Granuly –
 * metabolizable() z engine.js (NRC 2006). Chýbajúca vlhkosť = 10 %, popol = 7 % (docs/ANALYZER_V2.md, bod 6).
 */
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
  if (!a || a.fiber === null) return null;
  const me = metabolizable({ protein: a.protein, fat: a.fat, ash: a.ash ?? 7, fiber: a.fiber, moisture: a.moisture ?? 10 });
  return Number.isFinite(me.me) ? { kcal: me.me, estimated: true } : null;
}
