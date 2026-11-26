// Netlify naplánovaná funkcia: každý pondelok ráno pošle na info@granula.sk frontu na doplnenie.
// Čas je v UTC: 6:00 UTC = 7:00 v zime (SEČ), 8:00 v lete (SELČ).
import { sendDigest } from '../../lib/digest';

export default async function tyzdennyPrehlad() {
  try {
    const status = await sendDigest(process.env);
    console.log('tyzdenny-prehlad:', status);
    return new Response(status);
  } catch (e) {
    console.error('tyzdenny-prehlad zlyhal:', e);
    return new Response('chyba', { status: 500 });
  }
}

export const config = { schedule: '0 6 * * 1' };
