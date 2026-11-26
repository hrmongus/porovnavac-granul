import 'server-only';
import { chipText, sensitivityNote, type StoredResult } from '@/lib/result';
import { colorOf } from '@/lib/scoring/rules';
import { signToken } from './tokens';
import { GRANULA_CTA } from '@/lib/v2/granula';

// Farby podľa docs/DIZAJN.md (semafor hodnotenia)
const BG: Record<string, string> = {
  zelena: '#2E9D57', zlta: '#F5C518', oranzova: '#E8892B', cervena: '#C8322B', seda: '#BDB6AE',
};
const FG: Record<string, string> = {
  zelena: '#ffffff', zlta: '#000000', oranzova: '#000000', cervena: '#ffffff', seda: '#000000',
};
const FONT = "Montserrat,'Proxima Nova',Arial,Helvetica,sans-serif";
const chip = (color: string, text: string) =>
  `<span style="display:inline-block;padding:3px 8px;border:1.6px solid #000;background:${BG[color]};color:${FG[color]};font-weight:900;font-size:12px;text-transform:uppercase;white-space:nowrap">${text}</span>`;

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
    const note = sensitivityNote(it.sensitivity, it.explanation);
    return `<tr>
      <td style="padding:10px 8px;border-bottom:1.6px solid #000;vertical-align:top;font-weight:900">${it.position}.</td>
      <td style="padding:10px 8px;border-bottom:1.6px solid #000;vertical-align:top">
        <strong>${esc(it.raw)}</strong>${it.name ? `<br><span style="color:#3d3d3d;font-size:13px">${esc(it.name)}</span>` : ''}
        <div style="margin-top:4px">${esc(it.explanation)}${note ? ` ${esc(note)}` : ''}</div>
      </td>
      <td style="padding:10px 8px;border-bottom:1.6px solid #000;vertical-align:top;text-align:right">${chip(it.color, esc(chipText(it.color, it.score)))}</td></tr>`;
  }).join('');

  const scoreLine = result.score === null
    ? 'Skóre sa nedalo vypočítať – žiadnu zložku zatiaľ nepoznáme.'
    : `${chip(colorOf(result.score), `${result.score}/100`)}&nbsp; ${esc(result.verdict ?? '')}`;
  const market = result.percentile === null ? ''
    : `<p>Porovnanie s trhom: lepšie ako <strong>${result.percentile} %</strong> z ${result.market_count} granúl na slovenskom trhu (zber 2026-11).</p>`;
  const caps = result.caps.length ? `<p style="color:#555">Uplatnené obmedzenia: ${result.caps.map(esc).join('; ')}.</p>` : '';
  // Analyzér 2.0: ako sedí psovi, dávka, hlavné zistenia, ukazovatele
  const fit = result.fit && typeof result.fit.score === 'number' ? `<div style="border:1.6px solid #000;background:#fff;padding:12px 14px;margin:14px 0">
      <p style="margin:0 0 6px;font-weight:900;text-transform:uppercase">Ako sa hodí${dogName ? ` pre psa ${esc(dogName)}` : ''}: ${result.fit.score}/100 · ${esc(result.fit.title)}</p>
      ${result.fit.reasons.map((x) => `<div>${x.info ? 'ℹ️' : x.cap !== undefined ? '❌' : '⚠️'} ${esc(x.text)}</div>`).join('')}
      ${result.dose ? `<p style="margin:8px 0 0"><strong>Odporúčaná dávka: cca ${result.dose.grams} g denne</strong> (odhad). Začni touto dávkou a podľa váhy dolaď o ±10 %.</p>` : ''}
      ${result.fit.vetNote ? '<p style="margin:6px 0 0;font-size:12px;color:#3d3d3d">Nie je to veterinárna rada.</p>' : ''}
    </div>` : '';
  const finds = result.findings && (result.findings.good.length + result.findings.bad.length) ? `<ul style="padding-left:18px;margin:10px 0">
      ${result.findings.good.map((t) => `<li><strong>+</strong> ${esc(t)}</li>`).join('')}
      ${result.findings.bad.map((t) => `<li><strong>−</strong> ${esc(t)}</li>`).join('')}
    </ul>` : '';
  const inds = result.indicators?.length ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:10px 0">
      ${result.indicators.map((i) => `<tr><td style="padding:4px 0;font-weight:700">${esc(i.label)}</td><td style="padding:4px 0;text-align:right">${chip(colorOf(i.points), esc(i.word))}</td></tr>`).join('')}
    </table>` : '';

  const g = result.granula;
  const dn = dogName ? esc(dogName) : 'tvojho psa';
  const granulaBox = !g ? '' : `<div style="margin-top:20px;padding:16px;border:1.6px solid #000;background:#FFF7EE">
      <p style="margin:0 0 8px"><span style="display:inline-block;background:#FF6900;color:#000;font-weight:900;font-style:italic;padding:4px 9px">GRANULA!</span></p>
      <p style="margin:0 0 4px;font-size:16px;font-weight:900;text-transform:uppercase">Granule na mieru pre psa ${dn}</p>
      <p style="margin:0 0 10px;font-size:12px;color:#3d3d3d">Analyzér prevádzkuje Granula. Naše receptúry hodnotíme rovnakou verejnou metodikou ako všetky ostatné.</p>
      ${!g.available ? `<p style="margin:0">Pre psa ${dn} teraz nemáme vhodnú receptúru.</p>` : `
      <p style="margin:0 0 6px"><strong>Granula ${esc(g.name ?? '')}</strong> – ${g.better ? 'vyššie skóre zloženia aj lepšia zhoda s potrebami' : `granule vyskladané podľa potrieb psa ${dn}`}.</p>
      ${(g.why ?? []).map((w) => `<p style="margin:0 0 4px;font-size:13px">${esc(w)}</p>`).join('')}
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin:10px 0">
        <tr><td></td><td style="font-weight:900;padding:4px">Hodnotené krmivo</td><td style="font-weight:900;padding:4px">Granula</td></tr>
        <tr><td style="padding:4px">Skóre zloženia</td><td style="padding:4px">${result.score ?? '–'}/100</td><td style="padding:4px">${g.score ?? '–'}/100</td></tr>
        <tr><td style="padding:4px">Hodí sa</td><td style="padding:4px">${result.fit?.score ?? '–'}/100</td><td style="padding:4px">${g.fit?.score ?? '–'}/100</td></tr>
        <tr><td style="padding:4px">Mäso</td><td style="padding:4px">${result.parts?.meat_pct != null ? `${result.parts.meat_pct} %` : 'neuvádza'}</td><td style="padding:4px">${g.meat_pct != null ? `${g.meat_pct} %` : 'neuvádza'}</td></tr>
        <tr><td style="padding:4px">Dávka denne</td><td style="padding:4px">${result.dose ? `cca ${result.dose.grams} g` : '–'}</td><td style="padding:4px">cca ${g.grams} g</td></tr>
      </table>
      ${g.pricePerDay != null ? `<p style="margin:0 0 10px;font-size:13px">Cca ${g.pricePerDay.toFixed(2).replace('.', ',')} € na deň (vrece ${esc(g.bagLabel ?? '')}, s mesačným predplatným).</p>` : ''}
      <a href="${GRANULA_CTA}" style="display:inline-block;background:#FF6900;color:#000;border:1.6px solid #000;padding:12px 20px;font-weight:900;text-transform:uppercase;text-decoration:none">Objednať granule pre psa ${dn} →</a>`}
    </div>`;

  const consentBox = consentGiven
    ? `<p style="font-size:12px;color:#3d3d3d">Novinky od Granuly už nechceš dostávať? <a href="${appUrl()}/suhlas?akcia=odvolat&t=${signToken('revoke', leadId)}">Odvolať súhlas</a>.</p>`
    : `<p style="font-size:13px;color:#3d3d3d">Ak chceš od Granuly dostávať aj novinky a ponuky, súhlas môžeš potvrdiť tu: <a style="color:#0047BB" href="${appUrl()}/suhlas?akcia=potvrdit&t=${signToken('consent', leadId)}">Potvrdiť súhlas</a>. Bez neho ti iné správy neposielame.</p>`;

  const html = `<!doctype html><html lang="sk"><body style="margin:0;background:#F4EBE2;font-family:${FONT};color:#000;line-height:1.5">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px">
    <div style="background:#FFF7EE;border:1.6px solid #000;padding:20px">
    <h1 style="font-size:24px;font-weight:900;text-transform:uppercase;line-height:1.05;margin:0 0 8px">Rozbor zloženia${dogName ? ` pre <span style="color:#0047BB">${esc(dogName)}</span>` : ''}</h1>
    <p style="font-size:22px;font-weight:900;text-transform:uppercase;margin:14px 0">${scoreLine}</p>
    ${market}${fit}${finds}${inds}${caps}
    <p style="margin:18px 0"><a href="${link}" style="display:inline-block;background:#0047BB;color:#F4EBE2;border:1.6px solid #0047BB;padding:12px 20px;font-weight:900;text-transform:uppercase;text-decoration:none">Otvoriť rozbor →</a></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;border-top:1.6px solid #000">${rows}</table>
    <p style="font-size:13px;color:#3d3d3d;margin-top:16px">Hodnotíme iba text zloženia podľa verejnej <a style="color:#0047BB" href="${appUrl()}/metodika">metodiky</a> (verzia ${esc(result.methodology_version)}). Farba je vždy doplnená textom a číslom.</p>
    </div>
    ${granulaBox}
    ${consentBox}
  </div></body></html>`;

  const text = [
    `Rozbor zloženia${dogName ? ` pre ${dogName}` : ''}`,
    result.score === null ? 'Skóre sa nedalo vypočítať.' : `${result.verdict} ${result.score}/100`,
    result.percentile === null ? '' : `Lepšie ako ${result.percentile} % granúl na slovenskom trhu.`,
    result.fit ? `${result.fit.title}: ${result.fit.reasons.map((x) => x.text).join(' ')}` : '',
    result.dose ? `Odporúčaná dávka: cca ${result.dose.grams} g denne (odhad).` : '',
    ...(result.findings ? [...result.findings.good.map((t) => `+ ${t}`), ...result.findings.bad.map((t) => `- ${t}`)] : []),
    `Trvalý odkaz: ${link}`,
    '',
    ...result.items.map((it) => `${it.position}. ${it.raw} – ${chipText(it.color, it.score)}\n   ${it.explanation}`),
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
