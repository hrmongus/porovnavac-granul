import { jsonError } from '@/lib/server/guard';

// Prepis textu z fotky – napojenie na Claude API sa dopĺňa v kroku 5.
export async function POST() {
  return jsonError('Rozpoznávanie textu z fotky zatiaľ nie je zapnuté. Vlož prosím text zloženia.', 503);
}
