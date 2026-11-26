'use client';
import { useMemo, useState } from 'react';
import { BREEDS } from '@/lib/dog/breeds';
import type { Activity, Body, DogAnswers, Focus } from '@/lib/dog/engine';
import { ALLERGY_OPTIONS, FOCUS_OPTIONS } from '@/lib/dog/validate';

export const EMPTY_DOG: DogAnswers = {
  name: '', sex: 'pes', breed: null, kg: 0, years: 0, months: 0,
  activity: 'mesto', neutered: 'nie', body: 'akurat', focus: [], allergies: [],
};

const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

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

/** 5 obrazoviek otázok o psovi (zhodné s konfigurátorom na granula.sk). */
export default function DogQuestions({ value, onChange, onDone, onBack }: {
  value: DogAnswers; onChange: (d: DogAnswers) => void; onDone: () => void; onBack: () => void;
}) {
  const [step, setStep] = useState(1);
  const [breedQ, setBreedQ] = useState(() => BREEDS.find((b) => b.id === value.breed)?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const set = (p: Partial<DogAnswers>) => onChange({ ...value, ...p });
  const dog = value.name.trim() || 'tvoj pes';

  const breedHits = useMemo(() => {
    const q = fold(breedQ.trim());
    if (q.length < 2 || BREEDS.find((b) => b.id === value.breed)?.name === breedQ) return [];
    return BREEDS.filter((b) => fold(b.name).includes(q)).slice(0, 8);
  }, [breedQ, value.breed]);

  function next() {
    setError(null);
    if (step === 1 && value.name.trim().length < 1) return setError('Napíš meno psa.');
    if (step === 3 && !(value.kg > 0)) return setError('Zadaj hmotnosť psa.');
    if (step === 3 && value.years === 0 && value.months === 0) return setError('Zadaj vek psa.');
    if (step < 5) setStep(step + 1);
    else onDone();
  }
  const toggle = <T extends string>(list: T[], id: T) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <form className="card stack" onSubmit={(e) => { e.preventDefault(); next(); }}>
      <p className="hint">Otázka {step} z 5</p>

      {step === 1 && (
        <>
          <h3>Ako sa volá tvoj pes?</h3>
          <div>
            <label htmlFor="dog-name">Meno</label>
            <input id="dog-name" type="text" maxLength={40} value={value.name} onChange={(e) => set({ name: e.target.value })} autoFocus />
          </div>
          <Choice name="sex" value={value.sex} onChange={(sex) => set({ sex })}
            options={[{ id: 'pes', label: 'Pes' }, { id: 'fenka', label: 'Fenka' }]} />
        </>
      )}

      {step === 2 && (
        <>
          <h3>Aké plemeno je {dog}?</h3>
          <div>
            <label htmlFor="breed">Plemeno</label>
            <input id="breed" type="text" autoComplete="off" value={breedQ} autoFocus
              onChange={(e) => { setBreedQ(e.target.value); set({ breed: null }); }} placeholder="Napr. labrador, kríženec…" />
          </div>
          {breedHits.length > 0 && (
            <ul className="hits" aria-label="Plemená">
              {breedHits.map((b) => (
                <li key={b.id}><button type="button" onClick={() => { set({ breed: b.id, kg: value.kg || b.avg }); setBreedQ(b.name); }}>{b.name} <span className="hint">({b.range} kg)</span></button></li>
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
            <input id="kg" type="text" inputMode="decimal" value={value.kg ? String(value.kg).replace('.', ',') : ''}
              onChange={(e) => set({ kg: parseFloat(e.target.value.replace(',', '.')) || 0 })} />
          </div>
          <div className="row">
            <div>
              <label htmlFor="years">Roky</label>
              <input id="years" type="text" inputMode="numeric" value={value.years || ''} onChange={(e) => set({ years: Math.min(25, parseInt(e.target.value, 10) || 0) })} />
            </div>
            <div>
              <label htmlFor="months">Mesiace</label>
              <input id="months" type="text" inputMode="numeric" value={value.months || ''} onChange={(e) => set({ months: Math.min(11, parseInt(e.target.value, 10) || 0) })} />
            </div>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h3>Ako vyzerá bežný deň?</h3>
          <Choice<Activity> name="activity" value={value.activity} onChange={(activity) => set({ activity })} options={[
            { id: 'doma', label: 'Prevažne doma, krátke prechádzky' },
            { id: 'mesto', label: 'Bežné prechádzky' },
            { id: 'sport', label: 'Veľa behu, túry, šport' },
            { id: 'praca', label: 'Pracovný pes' },
          ]} />
          <p className="field-title">Je kastrovaný?</p>
          <Choice name="neutered" value={value.neutered} onChange={(neutered) => set({ neutered })}
            options={[{ id: 'ano', label: 'Áno' }, { id: 'nie', label: 'Nie' }]} />
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
                <input type="checkbox" checked={value.focus.includes(f.id)} onChange={() => set({ focus: toggle<Focus>(value.focus, f.id) })} />
                <span>{f.label}</span>
              </label>
            ))}
          </div>
          <p className="field-title">Alergie alebo potraviny, ktoré {dog} nesmie</p>
          <div className="choices">
            {ALLERGY_OPTIONS.map((a) => (
              <label key={a.id} className="choice">
                <input type="checkbox" checked={value.allergies.includes(a.id)} onChange={() => set({ allergies: toggle(value.allergies, a.id) })} />
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
