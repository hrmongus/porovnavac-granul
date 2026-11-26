'use client';
import { useCallback, useState } from 'react';
import Turnstile, { turnstileEnabled } from './Turnstile';

export default function ReportForm({ analysisId }: { analysisId: string | null }) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const onToken = useCallback((t: string | null) => setToken(t), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch('/api/nahlasit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email, analysisId, turnstileToken: token }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Odoslanie sa nepodarilo.');
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="notice" role="status">Ďakujeme, hlásenie sme prijali a preveríme ho.</p>;

  return (
    <form className="card stack" onSubmit={submit}>
      {analysisId && <p className="hint">Hlásenie sa týka analýzy {analysisId}.</p>}
      <div>
        <label htmlFor="msg">Čo je nesprávne?</label>
        <textarea id="msg" required minLength={5} maxLength={1900} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Napr. zložka „sušená repná dužina“ je hodnotená zle, pretože…" />
      </div>
      <div>
        <label htmlFor="rep-email">E-mail pre odpoveď <span className="hint">(nepovinné)</span></label>
        <input id="rep-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Turnstile onToken={onToken} />
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={busy || (turnstileEnabled && !token)}>
        {busy ? 'Odosielam…' : 'Odoslať hlásenie'}
      </button>
    </form>
  );
}
