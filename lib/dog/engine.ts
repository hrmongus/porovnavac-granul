// Odpovede o psovi v tvare konfigurátora na granula.sk (kľúče a hodnoty z kviz.js / engine.js)
// a napojenie na engine Granuly (lib/dog/granula-engine.js – bez zmien).
import engine, { type ComputeResult, type Derived } from './granula-engine.js';

export type Activity = 'doma' | 'mesto' | 'sport' | 'praca';
export type Body = 'chudsi' | 'akurat' | 'navyse';

/** Presne kľúče konfigurátora: dogname, sex, breed, breedSet, kg, years, months, weeks, activity, neutered, pregnant, body, focus, allergies. */
export interface DogAnswers {
  dogname: string;
  sex: 'pes' | 'fenka';
  breed: string;      // id z BREEDS alebo ''
  breedSet: boolean;
  kg: string;         // konfigurátor ukladá čísla ako text
  years: string;
  months: string;
  weeks: string;
  activity: Activity;
  neutered: 'ano' | 'nie';
  pregnant: '' | 'early' | 'late';
  body: Body;
  focus: string[];
  allergies: string[];
  /** ručne zvolená receptúra a receptúra, pre ktorú platí (ako v konfigurátore) */
  recipe?: string;
  recipeFor?: string;
}

export const BREEDS = engine.BREEDS;
export type { ComputeResult, Derived };

export function compute(a: DogAnswers): ComputeResult {
  return engine.compute(a as unknown as Record<string, unknown>);
}

export const metabolizable = engine.metabolizable;
export const ENGINE_PRODUCTS = engine.PRODUCTS;

/** Denná potreba energie psa (kcal) – energy() z engine.js cez compute(). */
export function dailyKcal(a: DogAnswers): number {
  return compute(a).energy.kcal;
}
