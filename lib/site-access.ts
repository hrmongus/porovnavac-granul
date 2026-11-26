// Ochrana testovacej verzie heslom (SITE_PASSWORD). Funguje na serveri aj v proxy (Web Crypto).
export const ACCESS_COOKIE = 'site_access';

/** Hodnota cookie = hash hesla; pri zmene hesla sa všetci musia prihlásiť znova. */
export async function accessToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`granula-analyzer:${password}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Bezpečný návrat len na cestu v rámci webu. */
export function safeNext(next: unknown): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}
