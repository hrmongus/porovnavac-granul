import Anthropic from '@anthropic-ai/sdk';
import { jsonError, rateLimit, verifyTurnstile } from '@/lib/server/guard';

// Prepis textu zloženia z fotky. AI iba prepisuje, nič nehodnotí. Fotka sa nikam neukladá.
export const maxDuration = 60;

const MODEL = 'claude-opus-5-5';
const MAX_BYTES = 4.5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type ImageType = (typeof TYPES)[number];
const NOT_FOUND = 'ZLOZENIE_NENAJDENE';

const SYSTEM = `Si nástroj na prepis textu z fotografie obalu krmiva pre psov.
Úloha: nájdi na fotke časť „Zloženie“ (alebo „Složení“, „Composition“, „Ingredients“) a prepíš jej text presne tak, ako je vytlačený – vrátane percent, zátvoriek a interpunkcie, v pôvodnom jazyku.
Pravidlá:
- Vráť iba samotný text zloženia, bez nadpisu „Zloženie:“, bez úvodu a bez komentára.
- Neprepisuj analytické zložky, doplnkové látky, kŕmne dávky ani iný text z obalu.
- Nič nehodnoť, neopravuj, neprekladaj a nedopĺňaj. Nečitateľné miesto označ ako [?].
- Ak na fotke zloženie nie je alebo je úplne nečitateľné, vráť presne: ${NOT_FOUND}`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError('Rozpoznávanie textu z fotky zatiaľ nie je zapnuté. Vlož prosím text zloženia.', 503);
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError('Neplatná požiadavka.');
  }
  const file = form.get('foto');
  if (!(file instanceof Blob)) return jsonError('Chýba fotka.');
  if (file.size > MAX_BYTES) return jsonError('Fotka je príliš veľká. Skús ju odfotiť znova.');
  const mediaType = (TYPES as readonly string[]).includes(file.type) ? (file.type as ImageType) : 'image/jpeg';

  const token = form.get('turnstileToken');
  if (!(await verifyTurnstile(typeof token === 'string' ? token : null, req))) {
    return jsonError('Overenie proti spamu zlyhalo. Obnov stránku a skús to znova.', 403);
  }
  if (!(await rateLimit(req, 'prepis', 15))) return jsonError('Príliš veľa fotiek. Skús to o chvíľu.', 429);

  const data = Buffer.from(await file.arrayBuffer()).toString('base64');
  const client = new Anthropic();
  try {
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          { type: 'text', text: 'Prepíš text zloženia z tejto fotky.' },
        ],
      }],
    });
    if (msg.stop_reason === 'refusal') return jsonError('Fotku sa nepodarilo spracovať. Vlož prosím text zloženia.', 422);
    const text = msg.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()
      .replace(/^(zloženie|složení|composition|ingredients)\s*:\s*/i, '');
    if (!text || text.includes(NOT_FOUND)) {
      return jsonError('Na fotke sme nenašli zloženie. Odfoť časť „Zloženie“ zblízka a ostro.', 422);
    }
    return Response.json({ text });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return jsonError('Služba je momentálne preťažená. Skús to o chvíľu.', 503);
    if (e instanceof Anthropic.APIError) console.error('prepis', e.status, e.message);
    else console.error('prepis', e);
    return jsonError('Prepis sa nepodaril. Vlož prosím text zloženia.', 502);
  }
}
