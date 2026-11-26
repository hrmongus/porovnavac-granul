// Názov produktu bez zopakovanej značky („Panakei“ + „Panakei Granule…“ → „Panakei Granule…“), docs/ANALYZER_V2.md bod 5.
const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Vráti názov bez úvodnej značky (ak ňou začína); inak názov bezo zmeny. */
export function nameWithoutBrand(brand: string, name: string): string {
  const b = fold(brand.trim());
  if (!b) return name;
  const n = fold(name);
  if (!n.startsWith(b)) return name;
  const next = n.charAt(b.length);
  if (next && /[a-z0-9]/.test(next)) return name; // napr. značka „Brit“ a názov „Britannia…“
  const rest = name.slice(brand.trim().length).replace(/^[\s\-–—:|,]+/, '');
  return rest || name;
}

/** Celý zobrazovaný názov: značka + názov bez opakovania značky. */
export function displayName(brand: string, name: string): string {
  return `${brand} ${nameWithoutBrand(brand, name)}`.trim();
}
