import Link from 'next/link';
import { COLOR_LEGEND, COLOR_NAME, chipText, sensitivityNote, type ResultView } from '@/lib/result';
import { colorOf } from '@/lib/scoring/rules';

const PLACEHOLDER = 'Vysvetlenie tejto zložky, prečo ju výrobca používa a na čo si pri nej dať pozor, je súčasťou celého rozboru.';

export function ScoreBox({ r }: { r: ResultView }) {
  if (r.score === null) {
    return (
      <div className="card shadow">
        <p className="verdict">Skóre sa nedalo vypočítať</p>
        <p>Žiadnu zo zložiek zatiaľ nepoznáme. Doplníme ich do databázy.</p>
      </div>
    );
  }
  const color = colorOf(r.score);
  return (
    <div className="card shadow score-box">
      <div className={`score-num c-${color}`}>
        {r.score}<small>zo 100 · {COLOR_NAME[color]}</small>
      </div>
      <div>
        <p className="verdict">{r.verdict} {r.score}/100</p>
        {r.percentile !== null && (
          <p>Lepšie ako {r.percentile} % z {r.market_count} granúl na slovenskom trhu.</p>
        )}
        {r.caps.length > 0 && <p className="hint">Uplatnené obmedzenie: {r.caps.join('; ')}.</p>}
      </div>
    </div>
  );
}

export function IngredientList({ r }: { r: ResultView }) {
  return (
    <ol className="ing-list" aria-label="Zložky v poradí z etikety">
      {r.items.map((it) => {
        const note = sensitivityNote(it.sensitivity, it.explanation);
        return (
          <li key={it.position} className="ing">
            <div>
              <div className="raw"><span className="pos">{it.position}.</span>{it.raw}</div>
              {it.name && <div className="name">{it.name}</div>}
              {it.explanation !== null ? (
                <div className="expl">{it.explanation}{note && ` ${note}`}</div>
              ) : (
                <>
                  <div className="expl blurred" aria-hidden="true">{PLACEHOLDER}</div>
                  <div className="gate-cta">Celý rozbor ti pošleme na e-mail.</div>
                </>
              )}
            </div>
            <span className={`chip c-${it.color}`}>{chipText(it.color, it.score)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Legend() {
  return (
    <div className="card">
      <h3>Legenda</h3>
      <ul className="legend">
        {COLOR_LEGEND.map((l) => (
          <li key={l.color}>
            <span className={`chip c-${l.color}`}>{COLOR_NAME[l.color]} · {l.range}</span>
            <span>{l.text}</span>
          </li>
        ))}
      </ul>
      <p className="hint">
        Skóre produktu je vážený priemer podľa poradia zložiek na etikete. Podrobnosti v <Link href="/metodika">metodike</Link>.
      </p>
    </div>
  );
}
