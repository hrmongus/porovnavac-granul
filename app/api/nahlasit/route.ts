import { publicClient } from '@/lib/data';
import { jsonError, rateLimit, verifyTurnstile } from '@/lib/server/guard';

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError('Neplatná požiadavka.');
  }
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 320) || null : null;
  const analysisId = typeof body.analysisId === 'string' && /^[0-9a-f-]{36}$/i.test(body.analysisId) ? body.analysisId : null;
  if (message.length < 5) return jsonError('Popíšte prosím chybu (aspoň pár slov).');
  if (message.length > 1900) return jsonError('Text je príliš dlhý.');
  if (!(await verifyTurnstile(body.turnstileToken as string | undefined, req))) {
    return jsonError('Overenie proti spamu zlyhalo. Obnovte stránku a skúste to znova.', 403);
  }
  if (!(await rateLimit(req, 'nahlasit', 5))) return jsonError('Príliš veľa hlásení. Skúste to neskôr.', 429);

  // Zápis s verejným kľúčom – RLS povoľuje len vloženie nového hlásenia.
  const { error } = await publicClient().from('error_reports').insert({
    message: analysisId ? `[analýza ${analysisId}] ${message}` : message,
    email,
  });
  if (error) {
    console.error('error_reports insert', error.message);
    return jsonError('Hlásenie sa nepodarilo odoslať. Skúste to znova.', 500);
  }
  return Response.json({ ok: true });
}
