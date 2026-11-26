'use client';
import { useState } from 'react';

// Zmena sa urobí až kliknutím (nie samotným otvorením odkazu – niektoré e-mailové služby odkazy otvárajú automaticky).
export default function ConsentAction({ action, token }: { action: 'potvrdit' | 'odvolat'; token: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function go() {
    setState('busy');
    const r = await fetch('/api/suhlas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, token }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setState('done');
    else {
      setError(j.error ?? 'Zmenu sa nepodarilo uložiť.');
      setState('error');
    }
  }

  if (state === 'done') {
    return <p className="notice" role="status">{action === 'potvrdit' ? 'Súhlas je potvrdený. Ďakujeme.' : 'Súhlas je odvolaný.'}</p>;
  }
  return (
    <>
      {state === 'error' && <p className="error" role="alert">{error}</p>}
      <button className="btn" onClick={go} disabled={state === 'busy' || !token}>
        {action === 'potvrdit' ? 'Potvrdiť súhlas' : 'Odvolať súhlas'}
      </button>
    </>
  );
}
