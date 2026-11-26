import { BREEDS, type Activity, type Body, type DogAnswers } from './engine';

const ACTIVITIES: Activity[] = ['doma', 'mesto', 'sport', 'praca'];
const BODIES: Body[] = ['chudsi', 'akurat', 'navyse'];

// Hodnoty a texty ako v konfigurátore na granula.sk (granule-na-mieru, krok 6 a 7).
export const FOCUS_OPTIONS: { id: string; label: string }[] = [
  { id: 'travenie', label: 'Citlivé trávenie' },
  { id: 'alergia', label: 'Nesedí mu každé mäso' },
  { id: 'kby', label: 'Kĺby a pohyb' },
  { id: 'srst', label: 'Srsť a koža' },
  { id: 'vaha', label: 'Váha' },
  { id: 'pankreas', label: 'Problémy s pankreasom' },
  { id: 'nic', label: 'Nič konkrétne' },
];
export const ALLERGY_OPTIONS: { id: string; label: string }[] = [
  { id: 'kuracie', label: 'Kuracie' }, { id: 'hovadzie', label: 'Hovädzie' }, { id: 'bravcove', label: 'Bravčové' },
  { id: 'morka', label: 'Morka' }, { id: 'kacica', label: 'Kačica' }, { id: 'hus', label: 'Hus' },
  { id: 'jahna', label: 'Jahňacie' }, { id: 'jelen', label: 'Jeleň' }, { id: 'kralik', label: 'Králik' },
  { id: 'ryby', label: 'Ryby' }, { id: 'vajcia', label: 'Vajcia' }, { id: 'ryza', label: 'Ryža' },
  { id: 'zemiaky', label: 'Zemiaky' },
  // navyše oproti konfigurátoru (docs/ANALYZER_V2.md, bod 3); engine Granuly ich ignoruje
  { id: 'psenica', label: 'Pšenica' }, { id: 'kukurica', label: 'Kukurica' }, { id: 'soja', label: 'Sója' },
];

const numText = (x: unknown, max: number): string | null => {
  const n = typeof x === 'number' ? x : typeof x === 'string' ? parseFloat(x.replace(',', '.')) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= max ? String(n) : null;
};

/** Overí odpovede z prehliadača a vráti ich v tvare konfigurátora. null = neplatné. */
export function parseDog(v: unknown): DogAnswers | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const dogname = typeof o.dogname === 'string' ? o.dogname.trim().slice(0, 40) : '';
  const kg = numText(o.kg, 120);
  const years = numText(o.years || '0', 25);
  const months = numText(o.months || '0', 11);
  if (!dogname || kg === null || +kg <= 0 || years === null || months === null) return null;
  if (+years === 0 && +months === 0) return null;
  const breed = typeof o.breed === 'string' && BREEDS.some((b) => b.id === o.breed) ? o.breed : '';
  const sex = o.sex === 'fenka' ? 'fenka' : 'pes';
  const neutered = o.neutered === 'ano' ? 'ano' : 'nie';
  const pregnant = sex === 'fenka' && neutered === 'nie' && (o.pregnant === 'early' || o.pregnant === 'late') ? o.pregnant : '';
  const pick = (list: unknown, opts: { id: string }[]) =>
    Array.isArray(list) ? opts.map((x) => x.id).filter((id) => (list as unknown[]).includes(id)) : [];
  const focus = pick(o.focus, FOCUS_OPTIONS);
  return {
    dogname, sex, breed, breedSet: breed !== '', kg, years: String(Math.floor(+years)), months: String(Math.floor(+months)), weeks: '',
    activity: ACTIVITIES.includes(o.activity as Activity) ? (o.activity as Activity) : 'mesto',
    neutered, pregnant,
    body: BODIES.includes(o.body as Body) ? (o.body as Body) : 'akurat',
    focus: focus.includes('nic') ? ['nic'] : focus,
    allergies: pick(o.allergies, ALLERGY_OPTIONS),
  };
}
