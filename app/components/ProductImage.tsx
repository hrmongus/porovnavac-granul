'use client';
import { useState } from 'react';

/** Skratka značky: „Royal Canin“ → „RC“, „Acana“ → „AC“. */
function initials(brand: string): string {
  const words = brand.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? '?').slice(0, 2).toUpperCase();
}

/**
 * Obrázok balenia priamo z pôvodného zdroja (docs/ANALYZER_V2.md, bod 11) – bez next/image, nič sa neukladá ani nekopíruje.
 * Ak chýba alebo sa nenačíta, zobrazí sa dlaždica so skratkou značky.
 */
export default function ProductImage({ url, brand, size }: { url: string | null | undefined; brand: string; size: 48 | 120 }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (!url || failed) {
    return <span className={`pimg pimg-tile pimg-${size}`} style={style} aria-hidden="true">{initials(brand)}</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- zámerne bez optimalizácie, obrázok sa načíta priamo zo zdroja
    <img className={`pimg pimg-${size}`} src={url} alt="" width={size} height={size} style={style}
      loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  );
}
