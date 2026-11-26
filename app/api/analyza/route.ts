import { analyze } from '@/lib/scoring/analyze';
import { loadReferenceData, percentileBelow } from '@/lib/data';
import { adminClient } from '@/lib/server/admin';
import { jsonError, rateLimit, verifyTurnstile } from '@/lib/server/guard';
import type { StoredResult } from '@/lib/result';

const MAX_LEN = 5000;

export async function POST(req: Request) {
  let body: { text?: unknown; inputType?: unknown; turnstileToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError('Neplatná požiadavka.');
  }
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const inputType = body.inputType === 'foto' ? 'foto' : 'text';
  if (text.length < 3) return jsonError('Vlož text zloženia.');
  if (text.length > MAX_LEN) return jsonError(`Text je príliš dlhý (najviac ${MAX_LEN} znakov).`);

  if (!(await verifyTurnstile(body.turnstileToken as string | undefined, req))) {
    return jsonError('Overenie proti spamu zlyhalo. Obnov stránku a skús to znova.', 403);
  }
  if (!(await rateLimit(req, 'analyza', 30))) {
    return jsonError('Príliš veľa požiadaviek. Skús to o chvíľu.', 429);
  }

  const ref = await loadReferenceData();
  const r = analyze(text, ref.aliases);
  if (r.items.length === 0) return jsonError('V texte sme nenašli žiadne zložky. Skontroluj, či ide o zloženie krmiva.');

  const result: StoredResult = {
    ...r,
    percentile: r.score === null ? null : percentileBelow(r.score, ref.marketScores),
    market_count: ref.marketScores.length,
  };
  const { data, error } = await adminClient().from('analyses').insert({
    input_type: inputType,
    input_raw: text,
    result,
    unknown_items: r.unknown_items,
    methodology_version: r.methodology_version,
  }).select('id').single();
  if (error || !data) {
    console.error('analyses insert', error?.message);
    return jsonError('Analýzu sa nepodarilo uložiť. Skús to znova.', 500);
  }
  return Response.json({ id: data.id });
}
