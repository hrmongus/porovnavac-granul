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
      .select('id, name, composition_date, source_url, image_url, brands(name)').eq('id', id).maybeSingle();
    if (!data) return jsonError('Produkt sa nenašiel.', 404);
    const brand = (data.brands as unknown as { name: string } | null)?.name ?? '';
    let domain: string | null = null;
    try { domain = data.source_url ? new URL(data.source_url).hostname.replace(/^www\./, '') : null; } catch { domain = null; }
    return Response.json({ id: data.id, brand, name: data.name, composition_date: data.composition_date, source: domain, image_url: data.image_url });
  }

  const q = normalizeSearch(url.searchParams.get('q') ?? '').slice(0, 80);
  if (q.length < 2) return Response.json({ items: [] });
  const tokens = q.split(' ');
  const { catalog } = await loadReferenceData();
  const items = catalog
    .filter((p) => tokens.every((t) => p.search.includes(t)))
    .map((p) => ({ p, score: relevance(p.search, q, tokens) }))
    // len podľa zhody s napísaným textom; pri rovnakej zhode kratší (presnejší) názov, potom abecedne
    .sort((x, y) => y.score - x.score || x.p.search.length - y.p.search.length || x.p.search.localeCompare(y.p.search))
    .slice(0, 10)
    .map(({ p: { id: pid, brand, name, image_url } }) => ({ id: pid, brand, name, image_url }));
  return Response.json({ items });
}

/** Ako dobre sedí značka + názov s hľadaným textom (bez ohľadu na značku). */
function relevance(text: string, query: string, tokens: string[]): number {
  let score = 0;
  const at = text.indexOf(query);
  if (at === 0) score += 150;                       // celý text na začiatku
  else if (at > 0 && text[at - 1] === ' ') score += 100; // celý text od začiatku slova
  else if (at > 0) score += 60;                      // celý text niekde v strede
  const words = text.split(' ');
  for (const t of tokens) {
    if (words.includes(t)) score += 15;              // celé slovo
    else if (words.some((w) => w.startsWith(t))) score += 10; // začiatok slova
    else score += 3;                                 // časť slova
  }
  return score;
}
