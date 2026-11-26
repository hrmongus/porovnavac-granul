import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Testovacia verzia: ak je nastavené SITE_PASSWORD, celý web je za jednoduchým heslom
// (prehliadač zobrazí okno na meno a heslo; meno môže byť ľubovoľné).
// Pre verejné spustenie stačí premennú SITE_PASSWORD na hostingu zmazať.
export function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const auth = request.headers.get('authorization') ?? '';
  if (auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const given = decoded.slice(decoded.indexOf(':') + 1);
      if (given === password) {
        const res = NextResponse.next();
        res.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return res;
      }
    } catch {
      // neplatná hlavička – pokračuje sa výzvou na heslo
    }
  }
  return new NextResponse('Testovacia verzia analyzéra – zadajte heslo.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Analyzer - test", charset="UTF-8"', 'X-Robots-Tag': 'noindex' },
  });
}

export const config = {
  // všetko okrem statických súborov Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
