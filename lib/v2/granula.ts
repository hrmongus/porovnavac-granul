// Odporúčanie Granula na mieru (docs/ANALYZER_V2.md, bod 9).
// Receptúru vyberá výhradne compute() z engine.js Granuly – rovnako ako konfigurátor na granula.sk.
// Hodnotí sa rovnakou metodikou a rovnakými pravidlami „ako sa hodí“ ako každé iné krmivo.
import { analyze, type AliasMap } from '../scoring/analyze';
import { compute, type DogAnswers } from '../dog/engine';
import { fitForDog, type Fit, type ProductInfo } from './report';

export interface GranulaPick {
  available: boolean;
  name?: string;
  img?: string;              // fotka receptúry z granula.sk (fotky Granuly zobrazovať smieme)
  why?: string[];            // 1–2 dôvody výberu (rule.why z engine.js)
  grams?: number;            // denná dávka z engine.js
  pricePerDay?: number | null;
  bagLabel?: string;
  score?: number | null;     // skóre zloženia (metodika 2.0)
  fit?: Fit;                 // ako sa hodí (bod 5)
  meat_pct?: number | null;
  better?: boolean;          // vyššie v oboch skóre → smie sa použiť „lepšie / vhodnejšie“
  sameAsInput?: boolean;     // používateľ hodnotil práve túto receptúru
}

export const GRANULA_ORIGIN = 'https://www.granula.sk/';

export interface GranulaDbProduct extends ProductInfo { composition_raw: string }

export function granulaPick(
  dog: DogAnswers,
  dbProducts: GranulaDbProduct[],
  aliases: AliasMap,
  input: { score: number | null; fitScore: number; productName: string | null; isGranula: boolean },
): GranulaPick {
  const c = compute(dog);
  if (!c.product || !c.dose) return { available: false };
  const db = dbProducts.find((p) => p.name === c.product!.name);
  const why = c.winner?.rule.why ? [`Vybrali sme ich, lebo ${c.winner.rule.why}.`] : [];
  if (c.derived.allergies.length) why.push('Receptúra neobsahuje suroviny, na ktoré je alergický.');
  const bag = c.bags.find((b) => b.bag.id === c.recBag) ?? c.bags[0];
  const discount = c.params.plans.mesiac ?? 0;
  const pricePerDay = bag && bag.price != null && bag.days > 0 ? Math.round((bag.price * (1 - discount) / bag.days) * 100) / 100 : null;

  let score: number | null = null;
  let fit: Fit | undefined;
  let meat_pct: number | null = null;
  if (db) {
    const r = analyze(db.composition_raw, aliases);
    score = r.score;
    meat_pct = r.parts?.meat_pct ?? null;
    fit = fitForDog(r, dog, db);
  }
  const better = score !== null && input.score !== null && fit !== undefined && score > input.score && fit.score > input.fitScore;
  return {
    available: true,
    name: c.product.name,
    img: GRANULA_ORIGIN + c.product.img,
    why: why.slice(0, 2),
    grams: c.dose.grams,
    pricePerDay,
    bagLabel: bag?.bag.label,
    score, fit, meat_pct, better,
    sameAsInput: input.isGranula && input.productName === c.product.name,
  };
}
