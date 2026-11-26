'use client';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Ochrana proti spamu (Cloudflare Turnstile). Bez nastaveného kľúča sa nezobrazí. */
/** `resetKey` – zmena hodnoty vyžiada nový token (token je jednorazový). */
export default function Turnstile({ onToken, resetKey = 0 }: { onToken: (t: string | null) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  useEffect(() => {
    if (resetKey > 0 && widgetId.current && window.turnstile) {
      onToken(null);
      window.turnstile.reset(widgetId.current);
    }
  }, [resetKey, onToken]);
  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    const el = ref.current;
    const render = () => {
      if (!window.turnstile || el.childElementCount > 0) return;
      widgetId.current = window.turnstile.render(el, {
        sitekey: SITE_KEY,
        language: 'sk',
        callback: (t: string) => onToken(t),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    };
    if (window.turnstile) return render();
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    if (!s) {
      s = document.createElement('script');
      s.src = SCRIPT;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener('load', render);
    return () => s?.removeEventListener('load', render);
  }, [onToken]);
  if (!SITE_KEY) return null;
  return <div ref={ref} />;
}

export const turnstileEnabled = Boolean(SITE_KEY);
