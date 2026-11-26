// Náhľad týždenného e-mailu bez odoslania: npm run digest:preview  → uloží digest-preview.html
import { writeFileSync } from 'fs';
import { buildDigestEmail, loadDigest } from '../lib/digest';

loadDigest().then((d) => {
  const { subject, html } = buildDigestEmail(d);
  writeFileSync('digest-preview.html', html);
  console.log(subject);
  console.log(`zložky: ${d.ingredients.length}, krmivá: ${d.foods.length} → digest-preview.html`);
}).catch((e) => { console.error(e); process.exit(1); });
