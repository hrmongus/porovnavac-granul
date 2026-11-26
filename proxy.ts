import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_COOKIE, accessToken } from './lib/site-access';

// Testovacia verzia: ak je nastavené SITE_PASSWORD, web je za stránkou s heslom (/heslo).
// Pre verejné spustenie stačí premennú SITE_PASSWORD na hostingu zmazať.
export async function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const open = pathname === '/heslo' || pathname === '/api/heslo';
  const ok = request.cookies.get(ACCESS_COOKIE)?.value === (await accessToken(password));

  let res: NextResponse;
  if (open || ok) {
    res = NextResponse.next();
  } else if (pathname.startsWith('/api/')) {
    res = NextResponse.json({ error: 'Testovacia verzia je chránená heslom. Obnov stránku.' }, { status: 401 });
  } else {
    const url = request.nextUrl.clone();
    url.pathname = '/heslo';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    res = NextResponse.redirect(url);
  }
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export const config = {
  // všetko okrem statických súborov Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
