import Link from 'next/link';
import { COLOR_LABEL, COLOR_LEGEND, sensitivityNote, type ResultView } from '@/lib/result';

const PLACEHOLDER = 'Vysvetlenie tejto zložky, prečo ju výrobca používa a na čo si pri nej dať pozor, je súčasťou celého rozboru.';

export function ScoreBox({ r }: { r: ResultView }) {
  if (r.score === null) {
    return (
      <div className="card">
        <p className="verdict">Skóre sa nedalo vypočítať</p>
        <p>Žiadnu zo zložiek zatiaľ nepoznáme. Doplníme ich do databázy.</p>
      </div>
    );
  }
  const color = r.score >= 90 ? 'zelena' : r.score >= 70 ? 'zlta' : r.score >= 50 ? 'oranzova' : 'cervena';
  return (
    <div className="card score-box">
      <div className={`score-num c-${color}`} aria-hidden="true">
        {r.score}<small>zo 100</small>
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
          <li key={it.position} className={`ing c-${it.color}`} style={{ background: 'var(--card)' }}>
            <span className="bar" aria-hidden="true" />
            <div className="body" style={{ color: 'var(--text)' }}>
              <div className="raw"><span className="pos">{it.position}.</span>{it.raw}</div>
              {it.name && <div className="name">{it.name}</div>}
              {it.explanation !== null ? (
                <div className="expl">{it.explanation}{note && ` ${note}`}</div>
              ) : (
                <>
                  <div className="expl blurred" aria-hidden="true">{PLACEHOLDER}</div>
                  <div className="gate-cta">Celý rozbor vám pošleme na e-mail.</div>
                </>
              )}
            </div>
            <div className={`badge c-${it.color}`}>
              {it.score === null ? '–' : it.score}
              <span>{COLOR_LABEL[it.color]}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Legend() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Legenda</h2>
      <ul className="legend">
        {COLOR_LEGEND.map((l) => (
          <li key={l.color}>
            <span className={`chip c-${l.color}`}>{l.range} {COLOR_LABEL[l.color]}</span>
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
