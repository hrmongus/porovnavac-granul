import { adminClient } from '@/lib/server/admin';
import { jsonError, rateLimit, verifyTurnstile } from '@/lib/server/guard';
import { sendResultEmail } from '@/lib/server/email';
import { CONSENT_MARKETING_TEXT, RESULT_ONLY_TEXT } from '@/lib/consent';
import type { StoredResult } from '@/lib/result';

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RX = /^[0-9a-f-]{36}$/i;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError('Neplatná požiadavka.');
  }
  const analysisId = typeof body.analysisId === 'string' && UUID_RX.test(body.analysisId) ? body.analysisId : null;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const dogName = typeof body.dogName === 'string' ? body.dogName.trim().slice(0, 80) || null : null;
  const consent = body.consentMarketing === true;

  if (!analysisId) return jsonError('Chýba analýza.');
  if (!EMAIL_RX.test(email) || email.length > 320) return jsonError('Zadaj platný e-mail.');
  if (!(await verifyTurnstile(body.turnstileToken as string | undefined, req))) {
    return jsonError('Overenie proti spamu zlyhalo. Obnov stránku a skús to znova.', 403);
  }
  if (!(await rateLimit(req, 'lead', 10))) return jsonError('Príliš veľa požiadaviek. Skús to o chvíľu.', 429);

  const sb = adminClient();
  const { data: analysis } = await sb.from('analyses').select('id, result, lead_id').eq('id', analysisId).single();
  if (!analysis) return jsonError('Analýza neexistuje.', 404);

  // Existujúci lead: nezaškrtnuté políčko neodvoláva skôr daný súhlas.
  const { data: existing } = await sb.from('leads').select('id, consent_marketing').eq('email', email).maybeSingle();
  let leadId: string;
  let consentGiven = consent;
  if (existing) {
    leadId = existing.id;
    consentGiven = existing.consent_marketing || consent;
    const update: Record<string, unknown> = {};
    if (dogName) update.dog_name = dogName;
    if (consent && !existing.consent_marketing) {
      Object.assign(update, { consent_marketing: true, consent_text: CONSENT_MARKETING_TEXT, consent_at: new Date().toISOString() });
    }
    if (Object.keys(update).length) await sb.from('leads').update(update).eq('id', leadId);
  } else {
    const { data: created, error } = await sb.from('leads').insert({
      email,
      dog_name: dogName,
      consent_marketing: consent,
      consent_text: consent ? CONSENT_MARKETING_TEXT : RESULT_ONLY_TEXT,
      source: 'analyzer',
    }).select('id').single();
    if (error || !created) {
      console.error('leads insert', error?.message);
      return jsonError('E-mail sa nepodarilo uložiť. Skús to znova.', 500);
    }
    leadId = created.id;
  }

  await sb.from('analyses').update({ lead_id: leadId }).eq('id', analysisId);

  const sent = await sendResultEmail({
    to: email,
    dogName,
    analysisId,
    leadId,
    consentGiven,
    result: analysis.result as StoredResult,
  });
  return Response.json({ ok: true, emailSent: sent });
}
