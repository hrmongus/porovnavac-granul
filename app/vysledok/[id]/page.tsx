import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminClient } from '@/lib/server/admin';
import type { StoredResult } from '@/lib/result';
import { Cta, Findings, FitBox, IngredientList, Indicators, ScoreBox } from '@/app/components/ResultTable';
import EmailGate from '@/app/components/EmailGate';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Výsledok analýzy', robots: { index: false, follow: false } };

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await adminClient().from('analyses').select('id, result, lead_id, dog, created_at').eq('id', id).maybeSingle();
  if (!data) notFound();
  const dog = data.dog as { name?: string; sex?: string } | null;
  const dogName = dog?.name || 'tvoj pes';
  const female = dog?.sex === 'fenka';

  // Výsledok sa zobrazí až po zadaní mena a e-mailu.
  if (data.lead_id === null) {
    return (
      <div className="stack">
        <h1>Výsledok <span className="hl">je hotový</span></h1>
        <EmailGate analysisId={data.id} dogName={dogName} />
      </div>
    );
  }

  const r = data.result as StoredResult;
  const date = new Date(data.created_at).toLocaleDateString('sk-SK');
  return (
    <div className="stack">
      <h1>Výsledok <span className="hl">analýzy</span></h1>
      <ScoreBox r={r} />
      <FitBox r={r} dogName={dogName} female={female} />
      <Findings r={r} />
      <Indicators r={r} />
      <IngredientList r={r} />
      <p className="hint">
        Analýza z {date} · metodika verzia {r.methodology_version}
        {r.product && <> · zloženie podľa etikety, zdroj: {r.product.source ?? 'neuvedený'}</>} ·{' '}
        <Link href={`/nahlasit-chybu?analyza=${data.id}`}>Nahlásiť chybu</Link> · <Link href="/">Vyhodnotiť ďalšie granule</Link>
      </p>
      <Cta dogName={dogName} />
    </div>
  );
}
