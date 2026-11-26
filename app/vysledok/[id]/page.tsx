import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminClient } from '@/lib/server/admin';
import { toView, type StoredResult } from '@/lib/result';
import { IngredientList, Legend, ScoreBox } from '@/app/components/ResultTable';
import EmailGate from '@/app/components/EmailGate';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Výsledok analýzy', robots: { index: false } };

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await adminClient().from('analyses').select('id, result, lead_id, created_at').eq('id', id).maybeSingle();
  if (!data) notFound();

  // Celý rozbor je dostupný po zadaní e-mailu (odkaz z e-mailu); dovtedy len verzia zadarmo.
  const unlocked = data.lead_id !== null;
  const r = toView(data.result as StoredResult, unlocked);
  const date = new Date(data.created_at).toLocaleDateString('sk-SK');

  return (
    <div className="stack">
      <h1>Výsledok <span className="hl">analýzy</span></h1>
      <p className="hint">Analýza z {date} · metodika verzia {r.methodology_version}</p>
      <ScoreBox r={r} />
      {r.locked && <EmailGate analysisId={data.id} />}
      <h2>Zložky <span className="hl">v poradí z etikety</span></h2>
      <IngredientList r={r} />
      {r.unknown_items.length > 0 && (
        <p className="hint">
          Šedé zložky zatiaľ nepoznáme, do skóre sa nepočítajú a doplníme ich.
        </p>
      )}
      <Legend />
      <p>
        <Link href="/">Analyzovať ďalšie zloženie</Link> · <Link href={`/nahlasit-chybu?analyza=${data.id}`}>Nahlásiť chybu v tomto rozbore</Link>
      </p>
    </div>
  );
}
