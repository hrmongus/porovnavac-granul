'use client';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Turnstile, { turnstileEnabled } from './Turnstile';

type Mode = 'foto' | 'text';

/** Zmenší fotku v prehliadači (rýchlejšie odoslanie, menej dát). */
async function downscale(file: File, maxSide = 2000): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', 0.85));
}

export default function AnalyzerForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('foto');
  const [text, setText] = useState('');
  const [fromPhoto, setFromPhoto] = useState(false);
  const [busy, setBusy] = useState<null | 'prepis' | 'analyza'>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const onToken = useCallback((t: string | null) => setToken(t), []);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy('prepis');
    try {
      const fd = new FormData();
      fd.append('foto', await downscale(file).catch(() => file), 'foto.jpg');
      if (token) fd.append('turnstileToken', token);
      const r = await fetch('/api/prepis', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Prepis sa nepodaril.');
      setText(j.text);
      setFromPhoto(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
      setResetKey((k) => k + 1);
      e.target.value = '';
    }
  }

  async function onAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (text.trim().length < 3) return setError('Vlož text zloženia.');
    setBusy('analyza');
    try {
      const r = await fetch('/api/analyza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, inputType: fromPhoto ? 'foto' : 'text', turnstileToken: token }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Analýza sa nepodarila.');
      router.push(`/vysledok/${j.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
      setResetKey((k) => k + 1);
    }
  }

  const waitingForCheck = turnstileEnabled && !token;

  return (
    <form className="card stack" onSubmit={onAnalyze}>
      <div className="tabs" role="tablist" aria-label="Spôsob zadania zloženia">
        <button type="button" role="tab" className="tab" aria-selected={mode === 'foto'} onClick={() => setMode('foto')}>
          Fotka zloženia
        </button>
        <button type="button" role="tab" className="tab" aria-selected={mode === 'text'} onClick={() => setMode('text')}>
          Vložiť text
        </button>
      </div>

      {mode === 'foto' && (
        <div>
          <p className="field-title">
            Odfoť zloženie na obale <span className="hint">(časť „Zloženie“, ostro a celé)</span>
          </p>
          <input id="foto" className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={onPhoto} disabled={busy !== null || waitingForCheck} />
          <label htmlFor="foto" className="btn file-btn" aria-disabled={busy !== null || waitingForCheck}>
            {busy === 'prepis' ? 'Prepisujem…' : 'Odfotiť alebo vybrať fotku'}
          </label>
          <p className="hint">
            AI z fotky iba prepíše text zloženia, nič nehodnotí. Fotku neukladáme. Rozpoznaný text môžeš pred analýzou opraviť.
          </p>
          {busy === 'prepis' && <p role="status">Prepisujem text z fotky…</p>}
        </div>
      )}

      {(mode === 'text' || text) && (
        <div>
          <label htmlFor="zlozenie">
            {fromPhoto ? 'Rozpoznaný text – skontroluj ho a prípadne oprav' : 'Text zloženia'}
          </label>
          <textarea
            id="zlozenie"
            value={text}
            maxLength={5000}
            onChange={(e) => setText(e.target.value)}
            placeholder="Napr.: Kuracie mäso sušené (30 %), ryža, kurací tuk, sušená repná dužina, ľanové semeno…"
          />
        </div>
      )}

      <Turnstile onToken={onToken} resetKey={resetKey} />
      {error && <p className="error" role="alert">{error}</p>}

      {(mode === 'text' || text) && (
        <button className="btn" type="submit" disabled={busy !== null || waitingForCheck}>
          {busy === 'analyza' ? 'Analyzujem…' : 'Analyzovať zloženie'}
        </button>
      )}
    </form>
  );
}
