import type { Metadata } from 'next';
import { safeNext } from '@/lib/site-access';

export const metadata: Metadata = { title: 'Testovacia verzia', robots: { index: false } };

export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ next?: string; chyba?: string }> }) {
  const { next, chyba } = await searchParams;
  return (
    <div className="stack" style={{ maxWidth: 480 }}>
      <h1>Testovacia <span className="hl">verzia</span></h1>
      <p className="lead">Analyzér je zatiaľ len na interné testovanie. Zadaj heslo, ktoré si dostal od tímu Granula.</p>
      <form className="card stack" method="post" action="/api/heslo">
        <input type="hidden" name="next" value={safeNext(next)} />
        <div>
          <label htmlFor="heslo">Heslo</label>
          <input id="heslo" name="heslo" type="text" autoComplete="current-password" required autoFocus />
        </div>
        {chyba === 'heslo' && <p className="error" role="alert">Nesprávne heslo. Skús to znova.</p>}
        {chyba === 'limit' && <p className="error" role="alert">Príliš veľa pokusov. Skús to o chvíľu.</p>}
        <button className="btn" type="submit">Vstúpiť</button>
      </form>
    </div>
  );
}
