// Test správnosti: pre všetky produkty v databáze musí výpočet dať rovnaké score_total (±1).
// Spustenie: npm run test:scoring  (potrebuje SUPABASE_URL a SUPABASE_PUBLISHABLE_KEY v .env)
import { analyze } from '../lib/scoring/analyze';
import { fetchAll, loadReferenceData, publicClient } from '../lib/data';

async function main() {
  const sb = publicClient();
  const ref = await loadReferenceData(sb);
  const products = await fetchAll<{ slug: string; composition_raw: string; score_total: number | null }>(
    sb, 'products', 'slug, composition_raw, score_total');

  let exact = 0, within1 = 0;
  const failed: string[] = [];
  const stats = { databaza: 0, pravidla: 0, neznama: 0 };
  for (const p of products) {
    const r = analyze(p.composition_raw, ref.aliases);
    for (const it of r.items) stats[it.source]++;
    const diff = r.score === null || p.score_total === null ? (r.score === p.score_total ? 0 : Infinity) : Math.abs(r.score - p.score_total);
    if (diff === 0) exact++;
    else if (diff <= 1) within1++;
    else failed.push(`${p.slug}: databáza ${p.score_total}, výpočet ${r.score}`);
  }
  // Kontrola aj bez databázy aliasov (čisté pravidlá = referenčná implementácia)
  const rulesOnlyFailed = products.filter((p) => analyze(p.composition_raw).score !== p.score_total).length;

  console.log(`Produktov:                 ${products.length}`);
  console.log(`Presná zhoda:              ${exact}`);
  console.log(`Rozdiel ±1:                ${within1}`);
  console.log(`Nezhoda (rozdiel > 1):     ${failed.length}`);
  console.log(`Len pravidlá – nezhoda:    ${rulesOnlyFailed}`);
  console.log(`Zložky z databázy / z pravidiel / neznáme: ${stats.databaza} / ${stats.pravidla} / ${stats.neznama}`);
  failed.slice(0, 20).forEach((f) => console.log('  ' + f));
  if (failed.length > 0) process.exit(1);
  console.log('VÝSLEDOK: OK');
}

main().catch((e) => { console.error(e); process.exit(1); });
