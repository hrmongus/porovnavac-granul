import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, accessToken, safeNext } from '@/lib/site-access';
import { rateLimit } from '@/lib/server/guard';

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const next = safeNext(form?.get('next'));
  const given = form?.get('heslo');
  const password = process.env.SITE_PASSWORD;
  const back = (q: string) => NextResponse.redirect(new URL(`/heslo?${q}&next=${encodeURIComponent(next)}`, req.url), 303);

  if (!password) return NextResponse.redirect(new URL(next, req.url), 303);
  if (!(await rateLimit(req, 'heslo', 20))) return back('chyba=limit');
  if (typeof given !== 'string' || given.trim() !== password) return back('chyba=heslo');

  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set(ACCESS_COOKIE, await accessToken(password), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
