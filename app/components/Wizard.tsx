'use client';
import { useCallback, useEffect, useState } from 'react';
import SourcePicker, { type Source } from './SourcePicker';
import DogQuestions, { EMPTY_DOG } from './DogQuestions';
import EmailGate from './EmailGate';
import Turnstile from './Turnstile';
import type { DogAnswers } from '@/lib/dog/engine';

type Step = 'vyber' | 'pes' | 'pocitam' | 'email';
interface Created { id: string; itemCount: number; marketCount: number; hasDose: boolean }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Postup: výber granúl → otázky o psovi → vyhodnocovanie → meno a e-mail → výsledok. */
export default function Wizard() {
  const [step, setStep] = useState<Step>('vyber');
  const [source, setSource] = useState<Source | null>(null);
  const [dog, setDog] = useState<DogAnswers>(EMPTY_DOG);
  const [created, setCreated] = useState<Created | null>(null);
  const [line, setLine] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const onToken = useCallback((t: string | null) => setToken(t), []);
  const consumeToken = useCallback(() => setResetKey((k) => k + 1), []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  async function evaluate() {
    if (!source) return;
    setError(null);
    setCreated(null);
    setLine(0);
    setStep('pocitam');
    const started = Date.now();
    try {
      const r = await fetch('/api/analyza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dog,
          turnstileToken: token,
          ...(source.kind === 'produkt' ? { productId: source.productId } : { text: source.text, inputType: source.fromPhoto ? 'foto' : 'text' }),
        }),
      });
      const j = await r.json();
      consumeToken();
      if (!r.ok) throw new Error(j.error ?? 'Vyhodnotenie sa nepodarilo.');
      setCreated(j);
      // animácia trvá 3–5 s; texty zodpovedajú tomu, čo sa naozaj počítalo
      const lines = j.hasDose ? 3 : 2;
      for (let i = 1; i <= lines; i++) { setLine(i); await sleep(1300); }
      await sleep(Math.max(0, 3500 - (Date.now() - started)));
      setStep('email');
    } catch (err) {
      setError((err as Error).message);
      setStep('pes');
    }
  }

  return (
    <div className="stack">
      {step === 'vyber' && (
        <SourcePicker token={token} consumeToken={consumeToken} onReady={(s) => { setSource(s); setStep('pes'); }} />
      )}

      {step === 'pes' && (
        <>
          {source && <p className="hint">Granule: <strong>{source.kind === 'produkt' ? source.label : 'zloženie z textu'}</strong></p>}
          {error && <p className="error" role="alert">{error}</p>}
          <DogQuestions value={dog} onChange={setDog} onDone={evaluate} onBack={() => setStep('vyber')} />
        </>
      )}

      {step === 'pocitam' && (
        <div className="card stack analyzing" role="status" aria-live="polite">
          <h3>Vyhodnocujeme…</h3>
          <ul className="steps">
            <li className={line >= 1 ? 'done' : ''}>{created ? `Čítame ${created.itemCount} ${created.itemCount === 1 ? 'zložku' : created.itemCount < 5 ? 'zložky' : 'zložiek'}…` : 'Čítame zloženie…'}</li>
            <li className={line >= 2 ? 'done' : ''}>{created ? `Porovnávame s ${created.marketCount.toLocaleString('sk-SK')} granulami…` : 'Porovnávame s trhom…'}</li>
            {(!created || created.hasDose) && <li className={line >= 3 ? 'done' : ''}>Počítame dávku pre psa {dog.name}…</li>}
          </ul>
        </div>
      )}

      {step === 'email' && created && <EmailGate analysisId={created.id} dogName={dog.name} />}

      <Turnstile onToken={onToken} resetKey={resetKey} />
    </div>
  );
}
