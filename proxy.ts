import { NextResponse } from 'next/server';

// Analyzér sa nemá indexovať vo vyhľadávačoch (docs/ANALYZER_V2.md, bod 1).
export function proxy() {
  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
