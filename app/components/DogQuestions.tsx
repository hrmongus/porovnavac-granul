'use client';
import { useMemo, useState } from 'react';
import { BREEDS, type Activity, type Body, type DogAnswers } from '@/lib/dog/engine';
import { ALLERGY_OPTIONS, FOCUS_OPTIONS } from '@/lib/dog/validate';

/** Prázdne odpovede v tvare konfigurátora na granula.sk. */
export const EMPTY_DOG: DogAnswers = {
  dogname: '', sex: 'pes', breed: '', breedSet: false, kg: '', years: '', months: '', weeks: '',
  activity: 'mesto', neutered: 'nie', pregnant: '', body: 'akurat', focus: [], allergies: [],
};

const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const toNum = (s: string) => parseFloat(s.replace(',', '.'));

function Choice<T extends string>({ name, value, options, onChange }: {
  name: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="choices" role="radiogroup">
      {options.map((o) => (
        <label key={o.id} className="choice">
          <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

/** 5 obrazoviek otázok o psovi – hodnoty rovnaké ako v konfigurátore na granula.sk. */
export default function DogQuestions({ value, onChange, onDone, onBack }: {
  value: DogAnswers; onChange: (d: DogAnswers) => void; onDone: () => void; onBack: () => void;
}) {
  const [step, setStep] = useState(1);
  const [breedQ, setBreedQ] = useState(() => BREEDS.find((b) => b.id === value.breed)?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const set = (p: Partial<DogAnswers>) => onChange({ ...value, ...p });
  const dog = value.dogname.trim() || 'tvoj pes';

  const breedHits = useMemo(() => {
    const q = fold(breedQ.trim());
    if (q.length < 2 || BREEDS.find((b) => b.id === value.breed)?.name === breedQ) return [];
    return BREEDS.filter((b) => fold(b.name).includes(q)).slice(0, 8);
  }, [breedQ, value.breed]);

  function next() {
    setError(null);
    if (step === 1 && value.dogname.trim().length < 1) return setError('Napíš meno psa.');
    if (step === 3 && !(toNum(value.kg) > 0)) return setError('Zadaj hmotnosť psa.');
    if (step === 3 && !(toNum(value.years || '0') > 0 || toNum(value.months || '0') > 0)) return setError('Zadaj vek psa.');
    if (step < 5) setStep(step + 1);
    else onDone();
  }
  const toggle = (list: string[], id: string) => {
    if (id === 'nic') return list.includes('nic') ? [] : ['nic'];
    const rest = list.filter((x) => x !== 'nic');
    return rest.includes(id) ? rest.filter((x) => x !== id) : [...rest, id];
  };
  const canBePregnant = value.sex === 'fenka' && value.neutered === 'nie';

  return (
    <form className="card stack" onSubmit={(e) => { e.preventDefault(); next(); }}>
      <p className="hint">Otázka {step} z 5</p>

      {step === 1 && (
        <>
          <h3>Ako sa volá tvoj pes?</h3>
          <div>
            <label htmlFor="dog-name">Meno</label>
            <input id="dog-name" type="text" maxLength={40} value={value.dogname} onChange={(e) => set({ dogname: e.target.value })} autoFocus />
          </div>
          <Choice name="sex" value={value.sex} onChange={(sex) => set({ sex, pregnant: sex === 'pes' ? '' : value.pregnant })}
            options={[{ id: 'pes', label: 'Pes' }, { id: 'fenka', label: 'Fenka' }]} />
        </>
      )}

      {step === 2 && (
        <>
          <h3>Aké plemeno je {dog}?</h3>
          <div>
            <label htmlFor="breed">Plemeno</label>
            <input id="breed" type="text" autoComplete="off" value={breedQ} autoFocus
              onChange={(e) => { setBreedQ(e.target.value); set({ breed: '', breedSet: false }); }} placeholder="Napr. labrador, kríženec…" />
          </div>
          {breedHits.length > 0 && (
            <ul className="hits" aria-label="Plemená">
              {breedHits.map((b) => (
                <li key={b.id}><button type="button" onClick={() => { set({ breed: b.id, breedSet: true, kg: value.kg || String(b.avg) }); setBreedQ(b.name); }}>{b.name} <span className="hint">({b.range} kg)</span></button></li>
              ))}
            </ul>
          )}
          <p className="hint">Kríženec? Vyber „Kríženec – malý / stredný / veľký“. Ak plemeno nenájdeš, pokračuj – veľkosť určíme podľa hmotnosti.</p>
        </>
      )}

      {step === 3 && (
        <>
          <h3>Koľko {dog} váži a koľko má rokov?</h3>
          <div>
            <label htmlFor="kg">Hmotnosť (kg)</label>
            <input id="kg" type="text" inputMode="decimal" value={value.kg.replace('.', ',')}
              onChange={(e) => set({ kg: e.target.value.replace(',', '.').replace(/[^0-9.]/g, '') })} />
          </div>
          <div className="row">
            <div>
              <label htmlFor="years">Roky</label>
              <input id="years" type="text" inputMode="numeric" value={value.years} onChange={(e) => set({ years: e.target.value.replace(/\D/g, '').slice(0, 2) })} />
            </div>
            <div>
              <label htmlFor="months">Mesiace</label>
              <input id="months" type="text" inputMode="numeric" value={value.months} onChange={(e) => set({ months: String(Math.min(11, +e.target.value.replace(/\D/g, '') || 0)).replace(/^0$/, '') })} />
            </div>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h3>Ako vyzerá bežný deň?</h3>
          <Choice<Activity> name="activity" value={value.activity} onChange={(activity) => set({ activity })} options={[
            { id: 'doma', label: 'Prevažne doma' },
            { id: 'mesto', label: '1–2 prechádzky denne' },
            { id: 'sport', label: 'Beh, túry, šport' },
            { id: 'praca', label: 'Pracovný pes' },
          ]} />
          <p className="field-title">Je kastrovan{value.sex === 'fenka' ? 'á' : 'ý'}?</p>
          <Choice name="neutered" value={value.neutered} onChange={(neutered) => set({ neutered, pregnant: neutered === 'ano' ? '' : value.pregnant })}
            options={[{ id: 'ano', label: 'Áno' }, { id: 'nie', label: 'Nie' }]} />
          {canBePregnant && (
            <>
              <p className="field-title">Je gravidná?</p>
              <Choice name="pregnant" value={value.pregnant} onChange={(pregnant) => set({ pregnant })} options={[
                { id: '', label: 'Nie' }, { id: 'early', label: 'Prvých 6 týždňov' }, { id: 'late', label: 'Posledné 3 týždne' },
              ]} />
            </>
          )}
          <p className="field-title">Postava</p>
          <Choice<Body> name="body" value={value.body} onChange={(body) => set({ body })} options={[
            { id: 'chudsi', label: 'Chudší' }, { id: 'akurat', label: 'Akurát' }, { id: 'navyse', label: 'Kilo navyše' },
          ]} />
        </>
      )}

      {step === 5 && (
        <>
          <h3>Na čo sa zamerať?</h3>
          <div className="choices">
            {FOCUS_OPTIONS.map((f) => (
              <label key={f.id} className="choice">
                <input type="checkbox" checked={value.focus.includes(f.id)} onChange={() => set({ focus: toggle(value.focus, f.id) })} />
                <span>{f.label}</span>
              </label>
            ))}
          </div>
          <p className="field-title">Alergie alebo potraviny, ktoré {dog} nesmie</p>
          <div className="choices">
            {ALLERGY_OPTIONS.map((a) => (
              <label key={a.id} className="choice">
                <input type="checkbox" checked={value.allergies.includes(a.id)}
                  onChange={() => set({ allergies: value.allergies.includes(a.id) ? value.allergies.filter((x) => x !== a.id) : [...value.allergies, a.id] })} />
                <span>{a.label}</span>
              </label>
            ))}
          </div>
          <p className="hint">Nič nevyberieš = bez obmedzení.</p>
        </>
      )}

      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button className="btn" type="submit">{step < 5 ? 'Ďalej' : 'Vyhodnotiť'}</button>
        <button type="button" className="linklike" onClick={() => (step > 1 ? setStep(step - 1) : onBack())}>Späť</button>
      </div>
    </form>
  );
}
