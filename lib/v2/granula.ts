// Odporúčanie Granula na mieru (docs/ANALYZER_V2.md, body 9 a 9.1 – rozhodnutie majiteľky 26. 11. 2026).
// Odporúča sa iba receptúra Granula, ktorá sa psovi hodí na 100/100 (rovnaké pravidlá ako pre každé krmivo).
// Poradie kandidátov: receptúra z compute() (engine.js) → druhá možnosť (second) → ostatné vhodné v poradí katalógu.
import { analyze, type AliasMap } from '../scoring/analyze';
import { compute, ENGINE_PRODUCTS, type DogAnswers } from '../dog/engine';
import { fitForDog, type Fit, type ProductInfo } from './report';

export type GranulaMode =
  | 'fits'       // krmivo používateľa sa hodí na 100 → žiadne odporúčanie (pri Granule tlačidlo objednať ju)
  | 'recommend'  // receptúra Granula so 100/100
  | 'none';      // žiadna receptúra nemá 100 → blok sa nezobrazí

export interface GranulaPick {
  mode: GranulaMode;
  recipeId?: string;         // id receptúry v engine.js (kviz: recipe)
  recipeFor?: string;        // receptúra, ktorú vybral engine (kviz: recipeFor)
  name?: string;
  img?: string;
  why?: string;              // jedna veta prečo (výhrady súčasného krmiva, ktoré receptúra nemá)
  grams?: number;
  pricePerDay?: number | null;
  bagLabel?: string;
  score?: number | null;
  fit?: Fit;
  meat_pct?: number | null;
  better?: boolean;          // vyššie aj v skóre zloženia → smie sa použiť „lepšie“
  /** staršie analýzy (pred bodom 9.1) */
  available?: boolean;
}

export const GRANULA_ORIGIN = 'https://www.granula.sk/';

export interface GranulaDbProduct extends ProductInfo { composition_raw: string }

/** Dávka a cena na deň pre konkrétnu receptúru – priamo z engine.js (recipe/recipeFor ako v konfigurátore). */
function engineOffer(dog: DogAnswers, recipeId: string, recipeFor: string | null) {
  const c = compute({ ...dog, ...(recipeFor && recipeId !== recipeFor ? { recipe: recipeId, recipeFor } : {}) } as DogAnswers);
  if (!c.product || c.product.id !== recipeId || !c.dose) return null;
  const bag = c.bags.find((b) => b.bag.id === c.recBag) ?? c.bags[0];
  const discount = c.params.plans.mesiac ?? 0;
  const pricePerDay = bag && bag.price != null && bag.days > 0 ? Math.round((bag.price * (1 - discount) / bag.days) * 100) / 100 : null;
  return { grams: c.dose.grams, pricePerDay, bagLabel: bag?.bag.label, img: GRANULA_ORIGIN + c.product.img };
}

export function granulaPick(
  dog: DogAnswers,
  dbProducts: GranulaDbProduct[],
  aliases: AliasMap,
  input: { score: number | null; fit: Fit; productName: string | null; isGranula: boolean },
): GranulaPick {
  const c = compute(dog);
  const recipeFor = c.winner?.id ?? null;

  // 1. Súčasné krmivo sa hodí na 100 → nič neodporúčame
  if (input.fit.score >= 100) {
    const own = input.isGranula ? ENGINE_PRODUCTS.find((p) => p.name === input.productName) : undefined;
    return own ? { mode: 'fits', recipeId: own.id, recipeFor: recipeFor ?? own.id, name: own.name } : { mode: 'fits' };
  }

  // 2. Kandidáti v poradí: compute() → second → ostatné vhodné v poradí katalógu
  const order: string[] = [];
  const add = (id: string | null | undefined) => { if (id && !order.includes(id)) order.push(id); };
  add(recipeFor);
  add(c.second?.id);
  for (const e of c.products) {
    if (e.eligible) add(e.product.id);
  }

  for (const id of order) {
    const ep = ENGINE_PRODUCTS.find((p) => p.id === id);
    const db = ep && dbProducts.find((p) => p.name === ep.name);
    if (!ep || !db) continue;
    const r = analyze(db.composition_raw, aliases);
    const fit = fitForDog(r, dog, db);
    if (fit.score < 100) continue;
    const offer = engineOffer(dog, id, recipeFor);
    if (!offer) continue;
    const fixes = input.fit.reasons.filter((x) => x.fix && !x.info).map((x) => x.fix as string);
    const unique = [...new Set(fixes)].slice(0, 2);
    return {
      mode: 'recommend',
      recipeId: id,
      recipeFor: recipeFor ?? id,
      name: ep.name,
      ...offer,
      why: unique.length ? `Hodí sa na 100/100: ${unique.join(' a ')}.` : 'Hodí sa na 100/100.',
      score: r.score,
      fit,
      meat_pct: r.parts?.meat_pct ?? null,
      better: r.score !== null && input.score !== null && r.score > input.score,
    };
  }

  // 3. Žiadna receptúra nemá 100 → blok sa nezobrazí
  return { mode: 'none' };
}
