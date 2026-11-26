import 'server-only';
import { randomUUID } from 'crypto';
import { adminClient } from './admin';
import { ALLERGY_OPTIONS } from '@/lib/dog/validate';
import type { DogAnswers } from '@/lib/dog/engine';

// Prepojenie s konfigurátorom na granula.sk (docs/ANALYZER_V2.md, bod 10).
// Odpovede o psovi (bez e-mailu) sa uložia cez POST https://www.granula.sk/api/quiz – rovnako ako to robí kviz.js –
// a odkaz granule-na-mieru.html?kviz=<id> otvorí na granula.sk rovno výsledok. Posiela server (nie prehliadač) kvôli CORS.
const QUIZ_API = 'https://www.granula.sk/api/quiz';
const CONFIGURATOR = 'https://www.granula.sk/granule-na-mieru.html';
const UTM = { utm_source: 'analyzer', utm_medium: 'web', utm_campaign: 'vysledok' };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// alergie, ktoré konfigurátor nepozná (pšenica, kukurica, sója), sa neposielajú
const CONFIGURATOR_ALLERGIES = new Set(ALLERGY_OPTIONS.map((a) => a.id).filter((id) => !['psenica', 'kukurica', 'soja'].includes(id)));

/** Odkaz na konfigurátor: s ?kviz=<id>, ak sa odpovede podarilo uložiť, inak len začiatok konfigurátora s UTM. */
export function configuratorUrl(quizId: string | null | undefined): string {
  const q = new URLSearchParams(quizId && UUID_RE.test(quizId) ? { kviz: quizId, ...UTM } : UTM);
  return `${CONFIGURATOR}?${q.toString()}`;
}

/** Odpovede presne v tvare konfigurátora (kľúče ANSWERS z kviz.js bez bag/bagKey/plan). */
export function quizAnswers(dog: DogAnswers, recipe?: { recipeId?: string; recipeFor?: string }) {
  return {
    dogname: dog.dogname, sex: dog.sex, breed: dog.breed, breedSet: dog.breedSet, kg: dog.kg, years: dog.years,
    months: dog.months, weeks: dog.weeks, activity: dog.activity, neutered: dog.neutered, pregnant: dog.pregnant,
    body: dog.body, focus: dog.focus, allergies: dog.allergies.filter((a) => CONFIGURATOR_ALLERGIES.has(a)),
    // receptúra z odporúčania (bod 9.1): recipe = odporúčaná, recipeFor = výber enginu
    ...(recipe?.recipeId ? { recipe: recipe.recipeId, recipeFor: recipe.recipeFor ?? recipe.recipeId } : {}),
  };
}

/** Pošle odpovede na granula.sk. Vráti id alebo null (chyba nikdy nič nezastaví). */
export async function postQuiz(dog: DogAnswers, recipe?: { recipeId?: string; recipeFor?: string }): Promise<string | null> {
  const id = randomUUID();
  try {
    const r = await fetch(QUIZ_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, step: 'vysledok', answers: quizAnswers(dog, recipe), plan: 'mesiac', utm: UTM, referrer: '', landing: 'analyzer' }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) {
      console.error('granula quiz POST', r.status, (await r.text()).slice(0, 300));
      return null;
    }
    return id;
  } catch (e) {
    console.error('granula quiz POST', e);
    return null;
  }
}

/** Zabezpečí id dotazníka pre analýzu (raz; uloží ho k analýze). */
export async function ensureQuizId(
  analysisId: string, dog: DogAnswers | null, existing: string | null, recipe?: { recipeId?: string; recipeFor?: string },
): Promise<string | null> {
  if (existing) return existing;
  if (!dog?.dogname) return null;
  const id = await postQuiz(dog, recipe);
  if (id) await adminClient().from('analyses').update({ granula_quiz_id: id }).eq('id', analysisId).is('granula_quiz_id', null);
  return id;
}
