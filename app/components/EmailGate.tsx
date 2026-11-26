'use client';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Turnstile, { turnstileEnabled } from './Turnstile';
import { CONSENT_MARKETING_TEXT, RESULT_ONLY_TEXT } from '@/lib/consent';

/** Okno pred výsledkom: meno a e-mail sú povinné, súhlas s marketingom dobrovoľný a nezaškrtnutý. */
export default function EmailGate({ analysisId, dogName }: { analysisId: string; dogName?: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false); // vždy nezaškrtnuté
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const onToken = useCallback((t: string | null) => setToken(t), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, name, email, consentMarketing: consent, turnstileToken: token }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Odoslanie sa nepodarilo.');
      router.push(`/vysledok/${analysisId}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="card shadow stack" onSubmit={submit} aria-labelledby="gate-title">
      <h3 id="gate-title">Výsledok {dogName ? <>pre psa <span className="hl">{dogName}</span> </> : ''}je hotový</h3>
      <p>Napíš meno a e-mail. Výsledok sa ti hneď zobrazí a kópiu pošleme aj na e-mail.</p>
      <div>
        <label htmlFor="gate-name">Tvoje meno</label>
        <input id="gate-name" type="text" required minLength={2} maxLength={120} autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="gate-email">E-mail</label>
        <input id="gate-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{CONSENT_MARKETING_TEXT} <span className="hint">(nepovinné)</span></span>
      </label>
      <p className="hint">
        {RESULT_ONLY_TEXT} Viac v <Link href="/ochrana-udajov">zásadách ochrany osobných údajov</Link>.
      </p>
      <Turnstile onToken={onToken} />
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn kobalt" type="submit" disabled={busy || (turnstileEnabled && !token)}>
        {busy ? 'Odosielam…' : 'Zobraziť výsledok'}
      </button>
    </form>
  );
}
