import { adminClient } from '@/lib/server/admin';
import { jsonError } from '@/lib/server/guard';
import { verifyToken } from '@/lib/server/tokens';
import { CONSENT_MARKETING_TEXT } from '@/lib/consent';

/** Dodatočné potvrdenie alebo odvolanie súhlasu s marketingom (odkaz z e-mailu). */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError('Neplatná požiadavka.');
  }
  const action = body.action === 'odvolat' ? 'odvolat' : 'potvrdit';
  const leadId = verifyToken(action === 'potvrdit' ? 'consent' : 'revoke', body.token as string);
  if (!leadId) return jsonError('Odkaz je neplatný.', 403);

  const update = action === 'potvrdit'
    ? { consent_marketing: true, consent_text: CONSENT_MARKETING_TEXT, consent_at: new Date().toISOString() }
    : { consent_marketing: false };
  const { error } = await adminClient().from('leads').update(update).eq('id', leadId);
  if (error) return jsonError('Zmenu sa nepodarilo uložiť.', 500);
  return Response.json({ ok: true });
}
