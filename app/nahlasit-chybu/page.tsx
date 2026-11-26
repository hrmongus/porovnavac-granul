import type { Metadata } from 'next';
import ReportForm from '@/app/components/ReportForm';

export const metadata: Metadata = { title: 'Nahlásiť chybu' };

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ analyza?: string }> }) {
  const { analyza } = await searchParams;
  const analysisId = analyza && /^[0-9a-f-]{36}$/i.test(analyza) ? analyza : null;
  return (
    <div className="stack">
      <h1>Nahlásiť <span className="hl">chybu</span></h1>
      <p className="lead">
        Našiel si nesprávne rozpoznanú alebo hodnotenú zložku, alebo chybu v texte? Napíš nám. Každé hlásenie preveríme.
      </p>
      <ReportForm analysisId={analysisId} />
    </div>
  );
}
