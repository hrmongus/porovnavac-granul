'use client';
import { useState } from 'react';
import { chipText, sensitivityNote } from '@/lib/result';
import type { AnalyzedItem } from '@/lib/scoring/analyze';

const norm = (s: string) =>
  s.replace(/\([^)]*\)|\[[^\]]*\]/g, '').replace(/\d+([.,]\d+)?\s*%/g, '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Zoznam zložiek: každý riadok je tlačidlo, ktoré rozbalí vysvetlenie. Prvá zložka je rozbalená hneď. */
export default function IngredientList({ items }: { items: AnalyzedItem[] }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(items.length ? [items[0].position] : []));
  const allOpen = items.length > 0 && open.size === items.length;
  const toggle = (pos: number) => setOpen((s) => {
    const n = new Set(s);
    if (n.has(pos)) n.delete(pos); else n.add(pos);
    return n;
  });

  return (
    <div className="stack">
      <button type="button" className="btn secondary toggle-all" aria-pressed={allOpen}
        onClick={() => setOpen(allOpen ? new Set() : new Set(items.map((it) => it.position)))}>
        {allOpen ? 'Zbaliť všetky' : 'Rozbaliť všetky vysvetlenia'}
      </button>
      <ol className="ing-list" aria-label="Zložky v poradí z etikety">
        {items.map((it) => {
          const isOpen = open.has(it.position);
          const id = `zlozka-${it.position}`;
          const showName = it.name && norm(it.name) !== norm(it.raw);
          const note = sensitivityNote(it.sensitivity, it.explanation);
          return (
            <li key={it.position} className={`ing${isOpen ? ' open' : ''}`}>
              <button type="button" className="ing-toggle" aria-expanded={isOpen} aria-controls={id} onClick={() => toggle(it.position)}>
                <span className="ing-main">
                  <span className="raw"><span className="pos">{it.position}.</span>{it.raw}</span>
                  {showName && <span className="name">{it.name}</span>}
                  <span className="ing-more" aria-hidden="true">{isOpen ? 'Skryť ▴' : 'Čo to je? ▾'}</span>
                </span>
                <span className="ing-side">
                  <span className={`chip c-${it.color}`}>{chipText(it.color, it.score)}</span>
                  <span className="ing-arrow" aria-hidden="true">{isOpen ? '▴' : '▾'}</span>
                </span>
              </button>
              <div id={id} className="expl" hidden={!isOpen}>
                {it.explanation}{note && ` ${note}`}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
