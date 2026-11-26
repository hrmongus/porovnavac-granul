import { BREEDS } from './breeds';
import type { Activity, Body, DogAnswers, Focus } from './engine';

const ACTIVITIES: Activity[] = ['doma', 'mesto', 'sport', 'praca'];
const BODIES: Body[] = ['chudsi', 'akurat', 'navyse'];
export const FOCUS_OPTIONS: { id: Focus; label: string }[] = [
  { id: 'travenie', label: 'Citlivé trávenie' },
  { id: 'klby', label: 'Kĺby a pohyb' },
  { id: 'srst', label: 'Srsť a koža' },
  { id: 'vaha', label: 'Váha' },
  { id: 'pankreas', label: 'Pankreas' },
];
export const ALLERGY_OPTIONS: { id: string; label: string }[] = [
  { id: 'kuracie', label: 'Kuracie' }, { id: 'hovadzie', label: 'Hovädzie' }, { id: 'bravcove', label: 'Bravčové' },
  { id: 'morka', label: 'Morka' }, { id: 'kacica', label: 'Kačica' }, { id: 'hus', label: 'Hus' },
  { id: 'jahna', label: 'Jahňacie' }, { id: 'jelen', label: 'Jeleň' }, { id: 'kralik', label: 'Králik' },
  { id: 'ryby', label: 'Ryby' }, { id: 'vajcia', label: 'Vajcia' }, { id: 'ryza', label: 'Ryža' },
  { id: 'zemiaky', label: 'Zemiaky' }, { id: 'psenica', label: 'Pšenica' }, { id: 'kukurica', label: 'Kukurica' },
  { id: 'soja', label: 'Sója' },
];

/** Overí odpovede z dotazníka (prichádzajú z prehliadača). null = neplatné. */
export function parseDog(v: unknown): DogAnswers | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const num = (x: unknown, max: number) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= max ? x : null);
  const name = typeof o.name === 'string' ? o.name.trim().slice(0, 40) : '';
  const kg = num(o.kg, 120);
  const years = num(o.years, 25);
  const months = num(o.months, 11);
  if (!name || kg === null || kg <= 0 || years === null || months === null) return null;
  const breed = typeof o.breed === 'string' && BREEDS.some((b) => b.id === o.breed) ? o.breed : null;
  const activity = ACTIVITIES.includes(o.activity as Activity) ? (o.activity as Activity) : 'mesto';
  const body = BODIES.includes(o.body as Body) ? (o.body as Body) : 'akurat';
  const focus = Array.isArray(o.focus) ? FOCUS_OPTIONS.map((f) => f.id).filter((id) => (o.focus as unknown[]).includes(id)) : [];
  const allergies = Array.isArray(o.allergies) ? ALLERGY_OPTIONS.map((a) => a.id).filter((id) => (o.allergies as unknown[]).includes(id)) : [];
  return {
    name, sex: o.sex === 'fenka' ? 'fenka' : 'pes', breed, kg, years: Math.floor(years), months: Math.floor(months),
    activity, neutered: o.neutered === 'ano' ? 'ano' : 'nie', body, focus, allergies,
  };
}
