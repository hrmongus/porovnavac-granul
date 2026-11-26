// Týždenný prehľad fronty na doplnenie (docs/ANALYZER_V2.md, bod 8.3).
// Samostatný modul bez Next.js závislostí – používa ho Netlify naplánovaná funkcia aj skript na náhľad.
import { createClient } from '@supabase/supabase-js';

export interface MissingIngredient { zlozka: string; pocet: number; z_analyz: number; naposledy: string; priklad: string | null }
export interface MissingFood { typ: string; krmivo: string; pocet: number; naposledy: string; zlozenie_ukazka: string | null }
export interface Digest { ingredients: MissingIngredient[]; foods: MissingFood[] }

const TOP = 20;

/** Načíta 20 najčastejších neznámych zložiek a 20 najčastejších chýbajúcich krmív (pohľady len pre service_role). */
export async function loadDigest(env: Record<string, string | undefined> = process.env): Promise<Digest> {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Chýba SUPABASE_URL alebo SUPABASE_SECRET_KEY');
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [z, k] = await Promise.all([
    sb.from('na_doplnenie_zlozky').select('zlozka, pocet, z_analyz, naposledy, priklad').limit(TOP),
    sb.from('na_doplnenie_krmiva').select('typ, krmivo, pocet, naposledy, zlozenie_ukazka').limit(TOP),
  ]);
  if (z.error) throw new Error(`na_doplnenie_zlozky: ${z.error.message}`);
  if (k.error) throw new Error(`na_doplnenie_krmiva: ${k.error.message}`);
  return { ingredients: (z.data ?? []) as MissingIngredient[], foods: (k.data ?? []) as MissingFood[] };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const day = (d: string) => new Date(d).toLocaleDateString('sk-SK');
const cut = (s: string | null, n = 90) => (s ? (s.length > n ? `${s.slice(0, n)}…` : s) : '');

export function buildDigestEmail(d: Digest, now = new Date()) {
  const th = 'style="text-align:left;padding:6px 8px;border-bottom:1.6px solid #000;font-size:12px;text-transform:uppercase"';
  const td = 'style="padding:6px 8px;border-bottom:1px solid #d6cfc6;vertical-align:top"';
  const ing = d.ingredients.map((r) => `<tr><td ${td}><strong>${esc(r.zlozka)}</strong></td><td ${td}>${r.pocet}${r.z_analyz ? ` <span style="color:#555">(${r.z_analyz} z analýz)</span>` : ''}</td><td ${td}>${esc(cut(r.priklad))}</td><td ${td}>${day(r.naposledy)}</td></tr>`).join('');
  const food = d.foods.map((r) => `<tr><td ${td}><strong>${esc(r.krmivo)}</strong><br><span style="color:#555;font-size:12px">${esc(r.typ)}</span></td><td ${td}>${r.pocet}</td><td ${td}>${esc(cut(r.zlozenie_ukazka))}</td><td ${td}>${day(r.naposledy)}</td></tr>`).join('');
  const table = (title: string, head: string[], rows: string, empty: string) => `
    <h2 style="font-size:18px;font-weight:900;text-transform:uppercase;margin:24px 0 8px">${title}</h2>
    ${rows ? `<table style="width:100%;border-collapse:collapse;font-size:14px"><tr>${head.map((h) => `<th ${th}>${h}</th>`).join('')}</tr>${rows}</table>` : `<p>${empty}</p>`}`;

  const html = `<!doctype html><html lang="sk"><body style="margin:0;background:#F4EBE2;font-family:Montserrat,Arial,sans-serif;color:#000">
  <div style="max-width:720px;margin:0 auto;padding:24px 16px"><div style="background:#FFF7EE;border:1.6px solid #000;padding:20px">
    <h1 style="font-size:22px;font-weight:900;text-transform:uppercase;margin:0 0 6px">Analyzér: fronta na doplnenie</h1>
    <p style="margin:0;color:#3d3d3d">Prehľad k ${day(now.toISOString())}. Najčastejšie neznáme zložky a krmivá, ktoré nie sú v databáze.</p>
    ${table(`Neznáme zložky (top ${TOP})`, ['Zložka', 'Počet', 'Príklad', 'Naposledy'], ing, 'Žiadne.')}
    ${table(`Chýbajúce krmivá (top ${TOP})`, ['Krmivo', 'Počet', 'Ukážka zloženia', 'Naposledy'], food, 'Žiadne.')}
    <p style="margin-top:20px;font-size:13px;color:#3d3d3d">Zložka z fronty zmizne sama, keď pre ňu pribudne zápis v databáze zložiek. Celý zoznam je v Supabase v pohľadoch <code>na_doplnenie_zlozky</code> a <code>na_doplnenie_krmiva</code>.</p>
  </div></div></body></html>`;
  const text = [
    `Analyzér – fronta na doplnenie (${day(now.toISOString())})`, '',
    'NEZNÁME ZLOŽKY', ...d.ingredients.map((r) => `${r.pocet}× ${r.zlozka} – ${cut(r.priklad, 60)}`), '',
    'CHÝBAJÚCE KRMIVÁ', ...d.foods.map((r) => `${r.pocet}× ${r.krmivo} (${r.typ})`),
  ].join('\n');
  return { subject: `Analyzér: ${d.ingredients.length} neznámych zložiek, ${d.foods.length} chýbajúcich krmív`, html, text };
}

/** Pošle prehľad cez Resend. Pri prázdnej fronte nič neposiela. */
export async function sendDigest(env: Record<string, string | undefined> = process.env): Promise<string> {
  const d = await loadDigest(env);
  if (d.ingredients.length === 0 && d.foods.length === 0) return 'fronta je prázdna – e-mail sa neposiela';
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return 'chýba RESEND_API_KEY alebo EMAIL_FROM – e-mail sa neposlal';
  const { subject, html, text } = buildDigestEmail(d);
  const to = env.DIGEST_TO || 'info@granula.sk';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html, text }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return `odoslané na ${to}`;
}
