// Typy pre lib/dog/granula-engine.js (iba časti, ktoré analyzér používa).
export type Size = 'trpaslicie' | 'male' | 'stredne' | 'velke' | 'obrie';
export interface Breed { id: string; name: string; size: Size; mix: boolean; range: string; avg: number }
export interface EngineProduct {
  id: string; name: string; img: string; protein: number; fat: number; ash: number; fiber: number; moisture: number;
  composition: string; glucosamine: number | null; chondroitin: number | null;
}
export interface Derived {
  ageMonths: number; breed: Breed | null; size: Size; stage: 'starter' | 'puppy' | 'adult' | 'senior';
  isPuppy: boolean; small: boolean; smallMid: boolean; largeGiant: boolean; obese: boolean; pancreas: boolean;
  allergies: string[]; intolerance: boolean; active: boolean; pregnant: string;
}
export interface Rule { id: string; label: string; why: string }
export interface ComputeResult {
  params: { plans: Record<string, number> };
  derived: Derived;
  winner: { id: string; rule: Rule } | null;
  second: { id: string } | null;
  products: { product: EngineProduct; eligible: boolean; reason: string }[];
  product: EngineProduct | null;
  energy: { kcal: number; factor: number; basis: string };
  dose: { grams: number } | null;
  bags: { bag: { id: string; kg: number; label: string }; days: number; price: number | null }[];
  recBag: string | null;
}
export interface Metabolizable { me: number; kcalPerG: number }
declare const engine: {
  BREEDS: Breed[];
  PRODUCTS: EngineProduct[];
  compute(answers: Record<string, unknown>): ComputeResult;
  metabolizable(p: { protein: number; fat: number; ash: number; fiber: number; moisture: number }): Metabolizable;
};
export default engine;
