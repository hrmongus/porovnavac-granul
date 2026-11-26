import { loadReferenceData, normalizeSearch } from '@/lib/data';
import { publicClient } from '@/lib/data';
import { jsonError } from '@/lib/server/guard';

// GET /api/produkty?q=acana  → max. 10 návrhov (značka + názov), bez ohľadu na diakritiku.
// GET /api/produkty?id=123   → detail na zobrazenie pri výbere (dátum zloženia, zdroj).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = Number(url.searchParams.get('id'));
  if (id > 0) {
    const { data } = await publicClient().from('products')
      .select('id, name, composition_date, source_url, brands(name)').eq('id', id).maybeSingle();
    if (!data) return jsonError('Produkt sa nenašiel.', 404);
    const brand = (data.brands as unknown as { name: string } | null)?.name ?? '';
    let domain: string | null = null;
    try { domain = data.source_url ? new URL(data.source_url).hostname.replace(/^www\./, '') : null; } catch { domain = null; }
    return Response.json({ id: data.id, brand, name: data.name, composition_date: data.composition_date, source: domain });
  }

  const q = normalizeSearch(url.searchParams.get('q') ?? '').slice(0, 80);
  if (q.length < 2) return Response.json({ items: [] });
  const tokens = q.split(' ');
  const { catalog } = await loadReferenceData();
  const items = catalog
    .filter((p) => tokens.every((t) => p.search.includes(t)))
    // najprv tie, kde značka/názov začína hľadaným slovom, potom abecedne
    .sort((a, b) => Number(!a.search.startsWith(tokens[0])) - Number(!b.search.startsWith(tokens[0]))
      || a.search.localeCompare(b.search))
    .slice(0, 10)
    .map(({ id: pid, brand, name }) => ({ id: pid, brand, name }));
  return Response.json({ items });
}
