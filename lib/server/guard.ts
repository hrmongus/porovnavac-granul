import 'server-only';
import { createHash } from 'crypto';
import { adminClient, hasAdmin } from './admin';

/** Jednosmerný hash IP adresy (IP sa nikde neukladá). */
export function clientHash(req: Request): string {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.SUPABASE_SECRET_KEY ?? '';
  return createHash('sha256').update(salt + ip).digest('hex').slice(0, 32);
}

/** Limit požiadaviek: najviac `max` za `windowMinutes` pre danú akciu a návštevníka. */
export async function rateLimit(req: Request, action: string, max: number, windowMinutes = 60): Promise<boolean> {
  if (!hasAdmin()) {
    console.warn('rateLimit: chýba serverový kľúč, limit sa neuplatňuje');
    return true;
  }
  const sb = adminClient();
  const bucket = `${action}:${clientHash(req)}`;
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count, error } = await sb.from('rate_limit_hits').select('id', { count: 'exact', head: true })
    .eq('bucket', bucket).gte('created_at', since);
  if (error) {
    console.error('rateLimit', error.message);
    return true; // pri výpadku nebránime používateľovi
  }
  if ((count ?? 0) >= max) return false;
  await sb.from('rate_limit_hits').insert({ bucket });
  return true;
}

/** Overenie Cloudflare Turnstile. Ak nie je nastavený kľúč, overenie sa preskočí (vývoj). */
export async function verifyTurnstile(token: string | undefined | null, req: Request): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  if (ip) body.set('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const j = (await r.json()) as { success?: boolean };
    return j.success === true;
  } catch (e) {
    console.error('turnstile', e);
    return false;
  }
}

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}
