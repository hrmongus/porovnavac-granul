// Záložné pravidlá pre zápisy zložiek, ktoré nie sú v ingredient_aliases.
// Presný prepis reference/ingredients_rules.py (metodika 2.0). Dáta pravidiel sú v rules-data.ts.
import { RULES, type RawRule } from './rules-data';

export type Color = 'zelena' | 'zlta' | 'oranzova' | 'cervena' | 'seda';

export interface Classified {
  key: string | null;
  name: string | null;
  category: string | null;
  classification: string | null;
  score: number | null;
  color: Color;
  explanation: string;
  sensitivity: string | null;
}

export function colorOf(score: number | null): Color {
  if (score === null) return 'seda';
  return score >= 90 ? 'zelena' : score >= 70 ? 'zlta' : score >= 50 ? 'oranzova' : 'cervena';
}

/** Ako Python: NFKD → len ASCII → lowercase. */
export function deacc(s: string): string {
  return s.normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase();
}

/** Ako Python str.strip(chars). */
export function stripChars(s: string, chars: string): string {
  let a = 0;
  let b = s.length;
  while (a < b && chars.includes(s[a])) a++;
  while (b > a && chars.includes(s[b - 1])) b--;
  return s.slice(a, b);
}

const rx = (p: string) => new RegExp(p);

interface DictRule {
  rx: RegExp;
  key: string;
  name: string;
  category: string;
  classification: string;
  score: number;
  explanation: string;
  sensitivity: string | null;
}

const toRule = (r: RawRule): DictRule => ({ ...r, rx: rx(r.rx) });
const D = RULES.D.map(toRule);
const EXTRA = RULES.EXTRA.map(toRule);
const ANIMALS = RULES.ANIMALS.map((a) => ({ rx: rx(a.rx), name: a.name, allergen: a.allergen }));
const FISH_GENERIC = rx(RULES.FISH_GENERIC);
const POULTRY_GENERIC = rx(RULES.POULTRY_GENERIC);
const MEAT_GENERIC = rx(RULES.MEAT_GENERIC);
const MUSSEL = rx(RULES.MUSSEL);
const JUNK = rx(RULES.JUNK);
const MEAT_SCORES: Record<string, number> = RULES.MEAT_SCORES;
const FAT_FISH: Record<string, number> = RULES.FAT_FISH;
// Rovnaké poradie ako v Pythone: EXTRA[:4] + D[12:] + EXTRA[4:]
const LATE_RULES = [...EXTRA.slice(0, 4), ...D.slice(12), ...EXTRA.slice(4)];

type Form = 'cerstve' | 'susene' | 'maso' | 'vnutor' | 'hydrolyz' | 'bielkov' | 'muck' | 'tuk' | 'vyvar';

function explainMeat(animal: string, form: Form): string {
  const cap = animal.charAt(0).toUpperCase() + animal.slice(1);
  const base: Record<Form, string> = {
    cerstve: `Čerstvé ${animal} mäso – konkrétne pomenovaný zdroj živočíšnych bielkovín. Pozor: čerstvé mäso obsahuje asi 70 % vody, takže po vysušení ho v granule zostane podstatne menej, než ukazuje percento na obale.`,
    susene: `Sušené (dehydrované) ${animal} mäso – konkrétne pomenovaný a koncentrovaný zdroj živočíšnych bielkovín. Percento na obale tu zodpovedá skutočnému podielu v granule lepšie ako pri čerstvom mäse.`,
    muck: `Múčka z ${animal} mäsa – pomleté vedľajšie produkty z bitúnkov (môžu obsahovať kosti, kožu, chrupavky). Z obalu sa nedá zistiť, z ktorých častí zvieraťa je; bielkoviny sú horšie stráviteľné ako z mäsa.`,
    hydrolyz: `Hydrolyzovaná ${animal} bielkovina – bielkovina z vedľajších živočíšnych produktov rozložená na menšie časti. Používa sa najmä na chuť; z obalu sa nedá zistiť, z ktorých častí zvieraťa je.`,
    bielkov: `${cap} bielkovina / proteín – spracovaná živočíšna bielkovina (zahriata, vysušená a pomletá). Podľa práva EÚ patrí do rovnakej kategórie ako múčka a z obalu sa nedá zistiť, z ktorých častí zvieraťa je.`,
    vnutor: `${cap} vnútornosti (pečeň, srdce, žalúdky…) – pomenované a výživovo veľmi hodnotné, prirodzene bohaté na vitamíny a minerály.`,
    tuk: `${cap} tuk / olej – pomenovaný zdroj energie a mastných kyselín.`,
    maso: `${cap} mäso – konkrétne pomenovaný zdroj živočíšnych bielkovín.`,
    vyvar: `${cap} vývar / omáčka – zlepšuje chuť, výživovo je doplnkom.`,
  };
  return base[form];
}

function formOf(t: string): Form {
  if (/tuk|olej|oil|fat|loj\b|sadl|mast\b|masti\b|lard/.test(t)) return 'tuk';
  if (/hydrolyz/.test(t)) return 'hydrolyz';
  if (/muck|moucka|meal/.test(t) && !/susen/.test(t)) return 'muck';
  if (/bielkovin|protein|proteín|bilkovin/.test(t)) return 'bielkov';
  if (/pecen|jater|srdc|zaludk|ladvin|oblick|kidney|droby|vnutor|liver|heart|gizzard|tripe|bachor|pluc|slezin|krk[yu]|chrupav/.test(t)) return 'vnutor';
  if (/vyvar|omack|broth|stock|gravy|bujon/.test(t)) return 'vyvar';
  if (/cerstv|fresh|surov|mrazen|chlazen|vykost|deboned|raw/.test(t)) return 'cerstve';
  if (/susen|dehydr|dried|vysus/.test(t)) return 'susene';
  return 'maso';
}

function fromRule(r: DictRule): Classified {
  return {
    key: r.key, name: r.name, category: r.category, classification: r.classification,
    score: r.score, color: colorOf(r.score), explanation: r.explanation, sensitivity: r.sensitivity,
  };
}

/** Text položky pripravený pre pravidlá (bez zátvoriek, diakritiky, dávok). null = nadpis/zvyšok, nie zložka. */
export function ruleText(raw: string): string | null {
  let t = stripChars(deacc(raw.replace(/\([^)]*\)|\[[^\]]*\]/g, '')), ' .,:;*');
  t = t.replace(/\d+([.,]\d+)?\s*(%|mg\/kg|g\/kg|mg|iu|ie|m\.j\.)/g, '').trim();
  if (!t || JUNK.test(t) || t.length < 3) return null;
  return t;
}

export const UNKNOWN: Classified = {
  key: null, name: null, category: null, classification: null, score: null, color: 'seda',
  explanation: 'Túto zložku zatiaľ nemáme v databáze. Nehodnotíme ju a doplníme ju.', sensitivity: null,
};

/** Prepis classify() z Pythonu. null = položka sa ignoruje (nadpis, hmotnosť…). */
export function classify(raw: string): Classified | null {
  const t = ruleText(raw);
  if (t === null) return null;
  // 1) nešpecifikované / umelé majú prednosť
  for (const r of D.slice(0, 12)) if (r.rx.test(t)) return fromRule(r);
  // 1b) zelenoústa mušľa = doplnok na kĺby, nie mäso
  if (MUSSEL.test(t)) { const k = D.find((r) => r.key === 'klby'); if (k) return fromRule(k); }
  // 2) pomenované zviera
  const found = ANIMALS.find((a) => a.rx.test(t));
  const animal = found?.name ?? null;
  const allerg = found?.allergen ?? null;
  const isFishy = FISH_GENERIC.test(t);
  if (animal || POULTRY_GENERIC.test(t) || isFishy || MEAT_GENERIC.test(t)) {
    const f = formOf(t);
    if (animal) {
      let sc = MEAT_SCORES[f];
      if (f === 'tuk') sc = FAT_FISH[animal] ?? 85;
      const names: Record<Form, string> = {
        cerstve: `${animal} mäso (čerstvé)`, susene: `${animal} mäso (sušené)`, maso: `${animal} mäso`,
        vnutor: `${animal} vnútornosti`, hydrolyz: `${animal} hydrolyzovaná bielkovina`, bielkov: `${animal} bielkovina`,
        muck: `${animal} múčka`, tuk: `${animal} tuk / olej`, vyvar: `${animal} vývar`,
      };
      const n = names[f];
      // Python str.capitalize(): prvé písmeno veľké, ostatné malé
      const name = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
      let expl = explainMeat(animal, f);
      if (allerg) expl += ' Kuracie je kvalitné mäso, ale patrí medzi častejšie alergény u psov.';
      return {
        key: `${deacc(animal).replace(/ /g, '-')}-${f}`,
        name,
        category: f === 'tuk' ? 'tuk_olej' : 'maso',
        classification: ['cerstve', 'susene', 'maso', 'vnutor', 'tuk', 'vyvar'].includes(f) ? 'pomenovana' : 'spracovana',
        score: sc, color: colorOf(sc), explanation: expl, sensitivity: allerg ? 'kuracie' : null,
      };
    }
    if (POULTRY_GENERIC.test(t)) {
      const sc = ({ tuk: 78, muck: 30, hydrolyz: 40, bielkov: 30 } as Record<string, number>)[f] ?? 80;
      return {
        key: `hydina-${f}`, name: `Hydina (${f})`, category: f === 'tuk' ? 'tuk_olej' : 'maso', classification: 'spracovana',
        score: sc, color: colorOf(sc), sensitivity: 'kuracie',
        explanation: 'Hydina bez uvedenia druhu (kura, morka, kačica…). Je to živočíšny zdroj, ale presné zviera nevieme – pri alergii na kuracie to nie je možné vylúčiť.',
      };
    }
    if (isFishy) {
      const sc = ({ tuk: 78, muck: 30, hydrolyz: 40, bielkov: 30 } as Record<string, number>)[f] ?? 78;
      return {
        key: `ryba-${f}`, name: `Ryba bez uvedenia druhu (${f})`, category: f === 'tuk' ? 'tuk_olej' : 'maso', classification: 'spracovana',
        score: sc, color: colorOf(sc), sensitivity: null,
        explanation: 'Ryba bez uvedenia druhu. Je to živočíšny zdroj (pri oleji aj omega-3 mastných kyselín), ale nevieme, aké ryby to sú.',
      };
    }
    return {
      key: 'maso-nespecifikovane', name: 'Mäso bez uvedenia zvieraťa', category: 'zivocisny_vedlajsi_produkt',
      classification: 'nespecifikovana', score: 20, color: colorOf(20), sensitivity: null,
      explanation: 'Mäso bez uvedenia, z akého zvieraťa pochádza. Pri alergii sa nedá overiť a nie je jasná ani kvalita surovín.',
    };
  }
  // 3) ostatné zložky zo slovníka
  for (const r of LATE_RULES) if (r.rx.test(t)) return fromRule(r);
  return { ...UNKNOWN };
}
