import { analyze, carbsEstimate } from '@/lib/scoring/analyze';
import { loadReferenceData, percentileBelow, publicClient } from '@/lib/data';
import { adminClient } from '@/lib/server/admin';
import { jsonError, rateLimit, verifyTurnstile } from '@/lib/server/guard';
import { parseDog } from '@/lib/dog/validate';
import { doseFor, findings, fitForDog, indicators, type ProductInfo } from '@/lib/v2/report';
import { granulaPick, type GranulaDbProduct } from '@/lib/v2/granula';
import type { StoredResult } from '@/lib/result';

const MAX_LEN = 5000;

/** Vytvorí analýzu (bez leadu). Výsledok sa zobrazí až po zadaní mena a e-mailu. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError('Neplatná požiadavka.');
  }
  const dog = parseDog(body.dog);
  if (!dog) return jsonError('Chýbajú údaje o psovi (meno, hmotnosť, vek).');

  if (!(await verifyTurnstile(body.turnstileToken as string | undefined, req))) {
    return jsonError('Overenie proti spamu zlyhalo. Obnov stránku a skús to znova.', 403);
  }
  if (!(await rateLimit(req, 'analyza', 30))) return jsonError('Príliš veľa požiadaviek. Skús to o chvíľu.', 429);

  // Zdroj zloženia: produkt zo zoznamu, alebo text (vložený / z fotky)
  let text: string;
  let inputType: 'vyhladanie' | 'text' | 'foto';
  let productId: number | null = null;
  let productHint: string | null = null;
  let product: ProductInfo | null = null;
  const productIdIn = Number(body.productId);
  if (productIdIn > 0) {
    const { data } = await publicClient().from('products')
      .select('id, name, composition_raw, composition_date, source_url, analytical_raw, energy_raw, life_stage, nutritional_additives_raw, brands(name)')
      .eq('id', productIdIn).maybeSingle();
    if (!data) return jsonError('Produkt sa nenašiel.', 404);
    text = data.composition_raw;
    inputType = 'vyhladanie';
    productId = data.id;
    product = {
      brand: (data.brands as unknown as { name: string } | null)?.name ?? '',
      name: data.name, composition_date: data.composition_date, source_url: data.source_url,
      analytical_raw: data.analytical_raw, energy_raw: data.energy_raw, life_stage: data.life_stage,
      additives_raw: data.nutritional_additives_raw,
    };
  } else {
    text = typeof body.text === 'string' ? body.text.trim() : '';
    inputType = body.inputType === 'foto' ? 'foto' : 'text';
    productHint = typeof body.productHint === 'string' ? body.productHint.trim().slice(0, 200) || null : null;
    if (text.length < 3) return jsonError('Vlož text zloženia.');
    if (text.length > MAX_LEN) return jsonError(`Text je príliš dlhý (najviac ${MAX_LEN} znakov).`);
  }

  const ref = await loadReferenceData();
  const r = analyze(text, ref.aliases);
  if (r.items.length === 0) return jsonError('V texte sme nenašli žiadne zložky. Skontroluj, či ide o zloženie krmiva.');

  const dose = doseFor(dog, product);
  const fit = fitForDog(r, dog, product);
  const granula = granulaPick(dog, await granulaProducts(), ref.aliases, {
    score: r.score, fit, productName: product?.name ?? null, isGranula: product?.brand === 'Granula',
  });
  let sourceDomain: string | null = null;
  try { sourceDomain = product?.source_url ? new URL(product.source_url).hostname.replace(/^www\./, '') : null; } catch { sourceDomain = null; }
  const result: StoredResult = {
    ...r,
    percentile: r.score === null ? null : percentileBelow(r.score, ref.marketScores),
    market_count: ref.marketScores.length,
    product: product && { brand: product.brand, name: product.name, composition_date: product.composition_date, source: sourceDomain },
    fit,
    granula,
    dose,
    findings: findings(r, ref.marketMeatMedian),
    indicators: indicators(r, ref.marketMeatMedian),
    carbs: carbsEstimate(product?.analytical_raw),
    market_meat_median: ref.marketMeatMedian,
  };
  const { data, error } = await adminClient().from('analyses').insert({
    input_type: inputType,
    input_raw: text,
    product_id: productId,
    product_hint: productHint,
    result,
    dog,
    unknown_items: r.unknown_items,
    methodology_version: r.methodology_version,
  }).select('id').single();
  if (error || !data) {
    console.error('analyses insert', error?.message);
    return jsonError('Analýzu sa nepodarilo uložiť. Skús to znova.', 500);
  }
  // Údaje pre animáciu – zodpovedajú tomu, čo sa naozaj počítalo.
  return Response.json({ id: data.id, itemCount: r.items.length, marketCount: ref.marketScores.length, hasDose: dose !== null });
}

/** Receptúry Granula z databázy (hodnotia sa rovnako ako ostatné krmivá). */
async function granulaProducts(): Promise<GranulaDbProduct[]> {
  const { data } = await publicClient().from('products')
    .select('name, composition_raw, composition_date, source_url, analytical_raw, energy_raw, life_stage, nutritional_additives_raw, brands!inner(name, is_granula)')
    .eq('brands.is_granula', true);
  return (data ?? []).map((p) => ({
    brand: 'Granula', name: p.name, composition_raw: p.composition_raw, composition_date: p.composition_date, source_url: p.source_url,
    analytical_raw: p.analytical_raw, energy_raw: p.energy_raw, life_stage: p.life_stage, additives_raw: p.nutritional_additives_raw,
  }));
}
