'use client';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Turnstile, { turnstileEnabled } from './Turnstile';
import { CONSENT_MARKETING_TEXT, RESULT_ONLY_TEXT } from '@/lib/consent';

export default function EmailGate({ analysisId }: { analysisId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [dogName, setDogName] = useState('');
  const [consent, setConsent] = useState(false); // vždy nezaškrtnuté
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { emailSent: boolean }>(null);
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
        body: JSON.stringify({ analysisId, email, dogName, consentMarketing: consent, turnstileToken: token }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Odoslanie sa nepodarilo.');
      setDone({ emailSent: j.emailSent });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="notice" role="status">
        {done.emailSent
          ? `Celý rozbor sme poslali na ${email}. Nájdete ho aj nižšie.`
          : 'Celý rozbor je zobrazený nižšie. E-mail sa momentálne nepodarilo odoslať, odkaz na túto stránku si uložte.'}
      </div>
    );
  }

  return (
    <form className="card stack" onSubmit={submit} aria-labelledby="gate-title">
      <h2 id="gate-title" style={{ marginTop: 0 }}>Celý rozbor na e-mail</h2>
      <p>Pošleme vám vysvetlenie všetkých zložiek, porovnanie s trhom a trvalý odkaz na výsledok.</p>
      <div>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="dog">Meno psa <span className="hint">(nepovinné)</span></label>
        <input id="dog" type="text" maxLength={80} value={dogName} onChange={(e) => setDogName(e.target.value)} />
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
      <button className="btn" type="submit" disabled={busy || (turnstileEnabled && !token)}>
        {busy ? 'Odosielam…' : 'Poslať celý rozbor'}
      </button>
    </form>
  );
}
