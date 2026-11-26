import 'server-only';
import { COLOR_LABEL, sensitivityNote, type StoredResult } from '@/lib/result';
import { signToken } from './tokens';

const HEX: Record<string, string> = {
  zelena: '#1d7a46', zlta: '#9a7b00', oranzova: '#b85c00', cervena: '#b3261e', seda: '#6b6b6b',
};
const BG: Record<string, string> = {
  zelena: '#e3f3ea', zlta: '#fbf3d0', oranzova: '#fde8d4', cervena: '#fbe1df', seda: '#ececec',
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function appUrl(): string {
  return (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

interface Args {
  to: string;
  dogName: string | null;
  analysisId: string;
  leadId: string;
  consentGiven: boolean;
  result: StoredResult;
}

export function buildResultEmail({ dogName, analysisId, leadId, consentGiven, result }: Omit<Args, 'to'>) {
  const link = `${appUrl()}/vysledok/${analysisId}`;
  const rows = result.items.map((it) => {
    const label = it.score === null ? 'neznáma' : `${it.score} – ${COLOR_LABEL[it.color]}`;
    const note = sensitivityNote(it.sensitivity, it.explanation);
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #ddd;vertical-align:top;color:#555">${it.position}.</td>
      <td style="padding:8px;border-bottom:1px solid #ddd;vertical-align:top">
        <strong>${esc(it.raw)}</strong>${it.name ? `<br><span style="color:#555">${esc(it.name)}</span>` : ''}
        <div style="margin-top:4px;color:#333">${esc(it.explanation)}${note ? ` ${esc(note)}` : ''}</div>
      </td>
      <td style="padding:8px;border-bottom:1px solid #ddd;vertical-align:top;white-space:nowrap">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${BG[it.color]};color:${HEX[it.color]};font-weight:bold">${label}</span>
      </td></tr>`;
  }).join('');

  const scoreLine = result.score === null
    ? 'Skóre sa nedalo vypočítať – žiadnu zložku zatiaľ nepoznáme.'
    : `${esc(result.verdict ?? '')} ${result.score}/100`;
  const market = result.percentile === null ? ''
    : `<p>Porovnanie s trhom: lepšie ako <strong>${result.percentile} %</strong> z ${result.market_count} granúl na slovenskom trhu (zber 2026-11).</p>`;
  const caps = result.caps.length ? `<p style="color:#555">Uplatnené obmedzenia: ${result.caps.map(esc).join('; ')}.</p>` : '';
  const consentBox = consentGiven
    ? `<p style="font-size:12px;color:#777">Novinky od Granuly už nechcete dostávať? <a href="${appUrl()}/suhlas?akcia=odvolat&t=${signToken('revoke', leadId)}">Odvolať súhlas</a>.</p>`
    : `<p style="font-size:13px;color:#555">Ak chcete od Granuly dostávať aj novinky a ponuky, môžete súhlas potvrdiť tu: <a href="${appUrl()}/suhlas?akcia=potvrdit&t=${signToken('consent', leadId)}">Potvrdiť súhlas</a>. Bez neho vám iné správy neposielame.</p>`;

  const html = `<!doctype html><html lang="sk"><body style="margin:0;background:#f5f5f2;font-family:Arial,Helvetica,sans-serif;color:#222">
  <div style="max-width:640px;margin:0 auto;background:#fff;padding:24px">
    <h1 style="font-size:20px;margin:0 0 4px">Rozbor zloženia${dogName ? ` pre ${esc(dogName)}` : ''}</h1>
    <p style="font-size:26px;font-weight:bold;margin:12px 0">${scoreLine}</p>
    ${market}${caps}
    <p><a href="${link}">Trvalý odkaz na tento rozbor</a></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    <p style="font-size:13px;color:#555;margin-top:16px">Hodnotíme iba text zloženia podľa verejnej <a href="${appUrl()}/metodika">metodiky</a> (verzia ${esc(result.methodology_version)}). Farba je vždy doplnená číslom a slovom.</p>
    <div style="margin-top:24px;padding:16px;border:1px solid #ddd;background:#fafafa">
      <p style="margin:0 0 6px;font-size:12px;color:#777;text-transform:uppercase">Od prevádzkovateľa: Granula</p>
      <p style="margin:0">Analyzér prevádzkuje Granula. Hodnotenie je pre všetky krmivá rovnaké vrátane našich. Viac na <a href="https://granula.sk">granula.sk</a>.</p>
    </div>
    ${consentBox}
  </div></body></html>`;

  const text = [
    `Rozbor zloženia${dogName ? ` pre ${dogName}` : ''}`,
    result.score === null ? 'Skóre sa nedalo vypočítať.' : `${result.verdict} ${result.score}/100`,
    result.percentile === null ? '' : `Lepšie ako ${result.percentile} % granúl na slovenskom trhu.`,
    `Trvalý odkaz: ${link}`,
    '',
    ...result.items.map((it) => `${it.position}. ${it.raw} – ${it.score === null ? 'neznáma' : `${it.score} (${COLOR_LABEL[it.color]})`}\n   ${it.explanation}`),
    '',
    'Od prevádzkovateľa: Granula – https://granula.sk',
  ].join('\n');

  return { subject: result.score === null ? 'Rozbor zloženia granúl' : `Rozbor zloženia granúl: ${result.score}/100`, html, text };
}

/** Odošle e-mail cez Resend. Vráti false, ak služba nie je nastavená alebo zlyhá. */
export async function sendResultEmail(args: Args): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.warn('sendResultEmail: chýba RESEND_API_KEY alebo EMAIL_FROM, e-mail sa neodoslal');
    return false;
  }
  const { subject, html, text } = buildResultEmail(args);
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [args.to], subject, html, text }),
    });
    if (!r.ok) console.error('resend', r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.error('resend', e);
    return false;
  }
}
