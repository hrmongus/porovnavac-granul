// Odvodené údaje o psovi a denná potreba energie.
// Prevzaté z https://www.granula.sk/engine.js (vlastný kód Granuly, funkcie derive, factorFor, energy a PARAMS),
// stav 2026-11-26. Mení sa len zápis (TypeScript), nie logika ani čísla.
import { BREEDS, type Breed, type Size } from './breeds';

export const PARAMS = {
  // záloha, keď plemeno nie je v zozname: kategória z aktuálnej hmotnosti (kg, „menej než“)
  sizeMax: { trpaslicie: 5, male: 10, stredne: 25, velke: 45 },
  // šteňa do tohto veku (mesiace), podľa veľkostnej kategórie plemena
  puppyUntilMonths: { trpaslicie: 10, male: 10, stredne: 12, velke: 18, obrie: 24 } as Record<Size, number>,
  // senior od tohto veku (roky), podľa veľkostnej kategórie
  seniorFromYears: { trpaslicie: 9, male: 9, stredne: 8, velke: 7, obrie: 6 } as Record<Size, number>,
  starterWeeks: 9,
  // násobky pokojovej potreby energie RER (WSAVA / AAHA)
  factor: {
    puppyUnder4m: 3.0, puppyOver4m: 2.0, adultNeutered: 1.6, adultIntact: 1.8,
    inactive: 1.4, lightWork: 2.0, moderateWork: 3.0, weightLoss: 1.0,
  },
  overweightFraction: 0.10, // „kilo navyše“ ≈ o 10 % nad ideálom
  underweightBonus: 0.10,   // „chudší“ → +10 % energie
  roundTo: 5,               // zaokrúhlenie dávky (g)
};

export type Activity = 'doma' | 'mesto' | 'sport' | 'praca';
export type Body = 'chudsi' | 'akurat' | 'navyse';
export type Focus = 'travenie' | 'klby' | 'srst' | 'vaha' | 'pankreas';

/** Odpovede z dotazníka (rovnaké ako konfigurátor na granula.sk). */
export interface DogAnswers {
  name: string;
  sex: 'pes' | 'fenka';
  breed: string | null; // id z BREEDS
  kg: number;
  years: number;
  months: number;
  activity: Activity;
  neutered: 'ano' | 'nie';
  body: Body;
  focus: Focus[];
  allergies: string[];
}

export const SIZE_TEXT: Record<Size, string> = { trpaslicie: 'trpasličie', male: 'malé', stredne: 'stredné', velke: 'veľké', obrie: 'obrie' };
export const STAGE_TEXT = { starter: 'šteňa do 9. týždňa', puppy: 'šteňa', adult: 'dospelý', senior: 'senior' } as const;
export type Stage = keyof typeof STAGE_TEXT;

export interface Derived {
  ageMonths: number;
  breed: Breed | null;
  size: Size;
  stage: Stage;
  isPuppy: boolean;
  small: boolean;
  largeGiant: boolean;
  obese: boolean;
  active: boolean;
}

function sizeFromKg(kg: number): Size {
  const m = PARAMS.sizeMax;
  return kg < m.trpaslicie ? 'trpaslicie' : kg < m.male ? 'male' : kg < m.stredne ? 'stredne' : kg < m.velke ? 'velke' : 'obrie';
}

export function derive(a: DogAnswers): Derived {
  const ageMonths = a.years * 12 + a.months;
  const ageWeeks = Math.round(ageMonths * 52.18 / 12);
  const breed = BREEDS.find((b) => b.id === a.breed) ?? null;
  const size = breed ? breed.size : sizeFromKg(a.kg);
  const stage: Stage = ageWeeks < PARAMS.starterWeeks ? 'starter'
    : ageMonths < PARAMS.puppyUntilMonths[size] ? 'puppy'
    : ageMonths >= PARAMS.seniorFromYears[size] * 12 ? 'senior' : 'adult';
  return {
    ageMonths, breed, size, stage,
    isPuppy: stage === 'starter' || stage === 'puppy',
    small: size === 'trpaslicie' || size === 'male',
    largeGiant: size === 'velke' || size === 'obrie',
    obese: a.body === 'navyse',
    active: a.activity === 'sport' || a.activity === 'praca',
  };
}

function factorFor(a: DogAnswers, d: Derived): number {
  const F = PARAMS.factor;
  if (d.isPuppy) return d.ageMonths < 4 ? F.puppyUnder4m : F.puppyOver4m;
  if (d.obese) return F.weightLoss;
  if (a.activity === 'praca') return F.moderateWork;
  if (a.activity === 'sport') return F.lightWork;
  if (a.activity === 'doma' || d.stage === 'senior') return F.inactive;
  return a.neutered === 'ano' ? F.adultNeutered : F.adultIntact;
}

/** Denná potreba energie psa (kcal/deň) – RER × násobok. */
export function dailyKcal(a: DogAnswers, d: Derived = derive(a)): number {
  let weight = a.kg;
  if (d.obese && !d.isPuppy) weight = a.kg / (1 + PARAMS.overweightFraction);
  const rer = 70 * Math.pow(weight, 0.75);
  const mult = a.body === 'chudsi' ? 1 + PARAMS.underweightBonus : 1;
  return rer * factorFor(a, d) * mult;
}
