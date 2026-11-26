import type { Metadata } from 'next';
import ConsentAction from '@/app/components/ConsentAction';
import { CONSENT_MARKETING_TEXT } from '@/lib/consent';

export const metadata: Metadata = { title: 'Súhlas s novinkami', robots: { index: false } };

export default async function ConsentPage({ searchParams }: { searchParams: Promise<{ akcia?: string; t?: string }> }) {
  const { akcia, t } = await searchParams;
  const action = akcia === 'odvolat' ? 'odvolat' : 'potvrdit';
  return (
    <div className="stack">
      <h1>{action === 'potvrdit' ? 'Potvrdenie súhlasu' : 'Odvolanie súhlasu'}</h1>
      {action === 'potvrdit' ? (
        <p>Potvrdením udeľuješ tento súhlas: „{CONSENT_MARKETING_TEXT}“</p>
      ) : (
        <p>Po odvolaní ti už nebudeme posielať novinky ani ponuky.</p>
      )}
      <ConsentAction action={action} token={t ?? ''} />
    </div>
  );
}
