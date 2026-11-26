import { adminClient, hasAdmin } from '@/lib/server/admin';
import { jsonError, rateLimit } from '@/lib/server/guard';

// Anonymné uloženie neúspešného hľadania: len hľadaný text a dátum (tabuľka search_misses).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { query?: unknown } | null;
  const query = typeof body?.query === 'string' ? body.query.trim().slice(0, 200) : '';
  if (query.length < 2) return jsonError('Chýba hľadaný text.');
  if (!hasAdmin() || !(await rateLimit(req, 'nenaslo', 20))) return Response.json({ ok: true });
  await adminClient().from('search_misses').insert({ query });
  return Response.json({ ok: true });
}
