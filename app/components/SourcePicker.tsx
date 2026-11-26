'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { displayName, nameWithoutBrand } from '@/lib/product-name';

export type Source =
  | { kind: 'produkt'; productId: number; label: string }
  | { kind: 'text'; text: string; fromPhoto: boolean; hint: string };

type Mode = 'hladat' | 'foto' | 'text';
interface Hit { id: number; brand: string; name: string }
interface Detail extends Hit { composition_date: string | null; source: string | null }

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

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' }) : 'neuvedený');

export default function SourcePicker({ onReady, token, consumeToken }: {
  onReady: (s: Source) => void;
  token: string | null;
  consumeToken: () => void; // token je jednorazový – po použití sa vyžiada nový
}) {
  const [mode, setMode] = useState<Mode>('hladat');
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [picked, setPicked] = useState<Detail | null>(null);
  const [text, setText] = useState('');
  const [fromPhoto, setFromPhoto] = useState(false);
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/produkty?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json()).then((j) => setHits(j.items ?? [])).catch(() => {});
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  // Neúspešné hľadanie (≥ 3 znaky, nič sa nenašlo, 1,5 s bez písania) sa anonymne uloží do fronty na doplnenie.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 3 || hits === null || hits.length > 0) return;
    const t = setTimeout(() => {
      fetch('/api/nenaslo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [q, hits]);

  async function pick(h: Hit) {
    setError(null);
    const r = await fetch(`/api/produkty?id=${h.id}`);
    const j = await r.json();
    if (!r.ok) return setError(j.error ?? 'Produkt sa nepodarilo načítať.');
    setPicked(j);
  }

  function notFound(target: Mode) {
    if (!hint && q.trim().length >= 2) setHint(q.trim().slice(0, 200));
    setMode(target);
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('foto', await downscale(file).catch(() => file), 'foto.jpg');
      if (token) fd.append('turnstileToken', token);
      const r = await fetch('/api/prepis', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Prepis sa nepodaril.');
      setText(j.text);
      setFromPhoto(true);
      setMode('text');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      consumeToken();
      e.target.value = '';
    }
  }

  const shownHits = q.trim().length >= 2 ? hits : null;

  return (
    <div className="card stack">
      <div className="tabs" role="tablist" aria-label="Ako vybrať granule">
        {([['hladat', 'Vyhľadať'], ['foto', 'Odfotiť'], ['text', 'Vložiť text']] as const).map(([m, label]) => (
          <button key={m} type="button" role="tab" className="tab" aria-selected={mode === m} onClick={() => setMode(m)}>{label}</button>
        ))}
      </div>

      {mode === 'hladat' && !picked && (
        <div className="stack">
          <div>
            <label htmlFor="hladat">Značka alebo názov granúl</label>
            <input id="hladat" type="text" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Napr. Granula Jahňa s batátmi, Acana Adult…" />
          </div>
          {shownHits && shownHits.length > 0 && (
            <ul className="hits" role="listbox" aria-label="Návrhy">
              {shownHits.map((h) => (
                <li key={h.id}>
                  <button type="button" onClick={() => pick(h)}><strong>{h.brand}</strong> {nameWithoutBrand(h.brand, h.name)}</button>
                </li>
              ))}
            </ul>
          )}
          {shownHits && shownHits.length === 0 && <p className="hint">Nič sme nenašli.</p>}
          <p className="hint">
            Nenašli ste? <button type="button" className="linklike" onClick={() => notFound('foto')}>Odfoťte zloženie</button> alebo{' '}
            <button type="button" className="linklike" onClick={() => notFound('text')}>ho vložte</button>.
          </p>
        </div>
      )}

      {mode === 'hladat' && picked && (
        <div className="stack">
          <p className="picked"><strong>{picked.brand}</strong> {nameWithoutBrand(picked.brand, picked.name)}</p>
          <p className="hint">
            Zloženie podľa etikety, stav k {fmtDate(picked.composition_date)}. Zdroj: {picked.source ?? 'neuvedený'}. Výrobca mohol recept zmeniť.{' '}
            <Link href="/nahlasit-chybu">Nahlásiť chybu</Link>
          </p>
          <div className="row">
            <button type="button" className="btn" onClick={() => onReady({ kind: 'produkt', productId: picked.id, label: displayName(picked.brand, picked.name) })}>Pokračovať</button>
            <button type="button" className="linklike" onClick={() => setPicked(null)}>Vybrať iné</button>
          </div>
        </div>
      )}

      {mode === 'foto' && (
        <div>
          <p className="field-title">Odfoť zloženie na obale <span className="hint">(časť „Zloženie“, ostro a celé)</span></p>
          <input id="foto" className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={onPhoto} disabled={busy} />
          <label htmlFor="foto" className="btn file-btn" aria-disabled={busy}>{busy ? 'Prepisujem…' : 'Odfotiť alebo vybrať fotku'}</label>
          <p className="hint">AI z fotky iba prepíše text zloženia, nič nehodnotí. Fotku neukladáme. Text potom môžeš skontrolovať a opraviť.</p>
        </div>
      )}

      {mode === 'text' && (
        <div className="stack">
          <div>
            <label htmlFor="zlozenie">{fromPhoto ? 'Rozpoznaný text – skontroluj a prípadne oprav' : 'Text zloženia z obalu'}</label>
            <textarea id="zlozenie" value={text} maxLength={5000} onChange={(e) => setText(e.target.value)}
              placeholder="Napr.: Kuracie mäso sušené (30 %), ryža, kurací tuk, sušená repná dužina, ľanové semeno…" />
          </div>
          <div>
            <label htmlFor="hint">Aké granule to sú? <span className="hint">(značka a názov, nepovinné)</span></label>
            <input id="hint" type="text" maxLength={200} value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Napr. Brit Care Adult Lamb" />
            <p className="hint">Pomôže nám doplniť krmivo do databázy.</p>
          </div>
          <button type="button" className="btn" disabled={text.trim().length < 3}
            onClick={() => onReady({ kind: 'text', text, fromPhoto, hint: hint.trim() })}>Pokračovať</button>
        </div>
      )}

      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
