import Link from 'next/link';
import { COLOR_LEGEND, COLOR_NAME, chipText, sensitivityNote, type StoredResult } from '@/lib/result';
import { colorOf } from '@/lib/scoring/rules';

const CTA_URL = 'https://www.granula.sk/granule-na-mieru.html?utm_source=analyzer&utm_medium=referral&utm_campaign=vysledok';

export function ScoreBox({ r }: { r: StoredResult }) {
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
        <p className="verdict">{r.score}/100 · {r.verdict}</p>
        {r.percentile !== null && <p>Lepšie ako {r.percentile} % granúl na slovenskom trhu.</p>}
        {r.product && <p className="hint"><strong>{r.product.brand}</strong> {r.product.name}</p>}
      </div>
    </div>
  );
}

const FIT_ICON = { ok: '✅', warn: '⚠️', no: '❌' } as const;
const REASON_ICON = { ok: '✅', plus: '✅', warn: '⚠️', no: '❌' } as const;

export function FitBox({ r, dogName, female }: { r: StoredResult; dogName: string; female: boolean }) {
  if (!r.fit) return null;
  const f = r.fit;
  return (
    <div className={`card fit fit-${f.level}`}>
      <h3>Pre psa <span className="hl">{dogName}</span></h3>
      <p className="fit-title"><span aria-hidden="true">{FIT_ICON[f.level]}</span> {f.title}</p>
      {f.reasons.length > 0 && (
        <ul className="reasons">
          {f.reasons.map((x, i) => <li key={i}><span aria-hidden="true">{REASON_ICON[x.level]}</span> {x.text}</li>)}
        </ul>
      )}
      {f.level === 'ok' && f.reasons.length === 0 && <p>Podľa odpovedí sme nenašli nič, čo by nesedelo.</p>}
      {r.dose && (
        <p className="dose">
          <strong>{dogName} by {female ? 'mala' : 'mal'} zjesť cca {r.dose.grams} g denne</strong> (odhad). Začni touto dávkou a podľa váhy dolaď o ±10 %.
          {r.dose.estimatedEnergy && <span className="hint"> Energiu krmiva sme odhadli z analytických zložiek.</span>}
        </p>
      )}
      {f.vetNote && <p className="hint">Nie je to veterinárna rada.</p>}
    </div>
  );
}

export function Findings({ r }: { r: StoredResult }) {
  if (!r.findings || (r.findings.good.length + r.findings.bad.length === 0)) return null;
  return (
    <div className="card">
      <h3>Hlavné <span className="hl">zistenia</span></h3>
      <ul className="findings">
        {r.findings.good.map((t, i) => <li key={`g${i}`} className="good"><span className="sign" aria-label="plus">+</span>{t}</li>)}
        {r.findings.bad.map((t, i) => <li key={`b${i}`} className="bad"><span className="sign" aria-label="mínus">−</span>{t}</li>)}
      </ul>
    </div>
  );
}

export function Indicators({ r }: { r: StoredResult }) {
  if (!r.indicators?.length) return null;
  return (
    <div className="card">
      <h3>Štyri <span className="hl">ukazovatele</span></h3>
      <ul className="indicators">
        {r.indicators.map((ind) => (
          <li key={ind.key}>
            <details>
              <summary>
                <span className="ind-label">{ind.label}</span>
                <span className="ind-bar" aria-hidden="true"><span className={`c-${colorOf(ind.points)}`} style={{ width: `${Math.max(4, ind.points)}%` }} /></span>
                <span className="ind-word">{ind.word}</span>
              </summary>
              <p>{ind.text}</p>
            </details>
          </li>
        ))}
      </ul>
      <p className="hint">Klikni na ukazovateľ pre vysvetlenie. Ako sa počítajú, je v <Link href="/metodika">metodike</Link>.</p>
    </div>
  );
}

export function IngredientList({ r }: { r: StoredResult }) {
  const n = r.items.length;
  return (
    <details className="ing-wrap">
      <summary className="btn secondary">Zobraziť {n === 1 ? 'zložku' : `všetkých ${n} zložiek`}</summary>
      <ol className="ing-list" aria-label="Zložky v poradí z etikety">
        {r.items.map((it) => {
          const note = sensitivityNote(it.sensitivity, it.explanation);
          return (
            <li key={it.position} className="ing">
              <details>
                <summary>
                  <span className="raw"><span className="pos">{it.position}.</span>{it.raw}</span>
                  <span className={`chip c-${it.color}`}>{chipText(it.color, it.score)}</span>
                </summary>
                {it.name && <div className="name">{it.name}</div>}
                <div className="expl">{it.explanation}{note && ` ${note}`}</div>
              </details>
            </li>
          );
        })}
      </ol>
      {r.unknown_items.length > 0 && <p className="hint">Šedé zložky zatiaľ nepoznáme, do skóre sa nepočítajú a doplníme ich.</p>}
      {r.carbs != null && <p className="hint">Sacharidy odhadom {String(r.carbs).replace('.', ',')} % (z analytických zložiek). Len informácia, nehodnotia sa.</p>}
      {r.caps.length > 0 && <p className="hint">Uplatnené obmedzenie skóre: {r.caps.join('; ')}.</p>}
      <Legend />
    </details>
  );
}

export function Legend() {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>Legenda</h3>
      <ul className="legend">
        {COLOR_LEGEND.map((l) => (
          <li key={l.color}>
            <span className={`chip c-${l.color}`}>{COLOR_NAME[l.color]} · {l.range}</span>
            <span>{l.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Cta({ dogName }: { dogName: string }) {
  return (
    <div className="cta">
      <p>Chceš granule presne pre psa {dogName}?</p>
      <a className="btn" href={CTA_URL}>Vyskladaj si ich na granula.sk</a>
    </div>
  );
}
