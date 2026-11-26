import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

function secret(): string {
  const s = process.env.LINK_SECRET;
  if (!s) throw new Error('Chýba LINK_SECRET v premenných prostredia');
  return s;
}

/** Podpísaný token pre odkaz v e-maile (potvrdenie / odvolanie súhlasu). */
export function signToken(purpose: string, leadId: string): string {
  const mac = createHmac('sha256', secret()).update(`${purpose}:${leadId}`).digest('base64url').slice(0, 32);
  return `${leadId}.${mac}`;
}

export function verifyToken(purpose: string, token: string | null | undefined): string | null {
  if (!token) return null;
  const [leadId, mac] = token.split('.');
  if (!leadId || !mac) return null;
  const expected = signToken(purpose, leadId).split('.')[1];
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? leadId : null;
}
