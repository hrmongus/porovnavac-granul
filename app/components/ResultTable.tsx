import Link from 'next/link';
import { displayName, nameWithoutBrand } from '@/lib/product-name';
import ClickableIngredients from './IngredientList';
import ProductImage from './ProductImage';
import { COLOR_LEGEND, COLOR_NAME, type StoredResult } from '@/lib/result';
import { colorOf } from '@/lib/scoring/rules';


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
        {r.product && (
          <div className="product-line">
            <ProductImage url={r.product.image_url} brand={r.product.brand} size={120} />
            <p><strong>{r.product.brand}</strong> {nameWithoutBrand(r.product.brand, r.product.name)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const FIT_ICON = { vyborne: '✅', vyhrady: '⚠️', 'skor-nie': '⚠️', nie: '❌' } as const;
const FIT_COLOR = { vyborne: 'zelena', vyhrady: 'zlta', 'skor-nie': 'oranzova', nie: 'cervena' } as const;

export function FitBox({ r, dogName, female }: { r: StoredResult; dogName: string; female: boolean }) {
  if (!r.fit || typeof r.fit.score !== 'number') return null; // staršie analýzy bez skóre
  const f = r.fit;
  return (
    <div className={`card fit fit-${f.level}`}>
      <h3>Ako sa hodí pre psa <span className="hl">{dogName}</span></h3>
      <div className="score-box">
        <div className={`score-num small c-${FIT_COLOR[f.level]}`}>{f.score}<small>zo 100</small></div>
        <p className="fit-title"><span aria-hidden="true">{FIT_ICON[f.level]}</span> {f.title}</p>
      </div>
      {f.reasons.length > 0 && (
        <ul className="reasons">
          {f.reasons.map((x, i) => <li key={i}>{x.info ? 'ℹ️' : x.cap !== undefined ? '❌' : '⚠️'} {x.text}{!x.info && x.cap === undefined && <span className="hint"> (−{x.points})</span>}</li>)}
        </ul>
      )}
      {f.score >= 100 && <p>Tieto granule sa psovi {dogName} hodia na 100 %.</p>}
      {r.dose && (
        <p className="dose">
          <strong>{dogName} by {female ? 'mala' : 'mal'} zjesť cca {r.dose.grams} g denne</strong> (odhad). Začni touto dávkou a podľa váhy dolaď o ±10 %.
          {r.dose.estimatedEnergy && <span className="hint"> Energiu krmiva sme vypočítali z analytických zložiek.</span>}
        </p>
      )}
      {!r.product && <p className="hint">Pri vloženom texte nepoznáme analytické zložky ani určenie krmiva, preto sme skontrolovali len zloženie (alergie, trávenie, kĺby). Dávku bez analytických zložiek nevieme vypočítať.</p>}
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
  return (
    <section className="stack" aria-labelledby="zlozky-title">
      <h3 id="zlozky-title">Zložky <span className="hl">v poradí z etikety</span></h3>
      <ClickableIngredients items={r.items} />
      {r.unknown_items.length > 0 && <p className="hint">Šedé zložky zatiaľ nepoznáme, do skóre sa nepočítajú a doplníme ich.</p>}
      {r.carbs != null && <p className="hint">Sacharidy odhadom {String(r.carbs).replace('.', ',')} % (z analytických zložiek). Len informácia, nehodnotia sa.</p>}
      {r.caps.length > 0 && <p className="hint">Uplatnené obmedzenie skóre: {r.caps.join('; ')}.</p>}
      <Legend />
    </section>
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

/** Bod 9: odporúčanie Granula – vizuálne oddelené, s označením prevádzkovateľa. */
export function GranulaBlock({ r, dogName, female, orderUrl }: { r: StoredResult; dogName: string; female: boolean; orderUrl: string }) {
  const g = r.granula;
  // bod 9.1: žiadne odporúčanie, ak sa krmivo hodí na 100 (okrem tlačidla pri Granule) alebo ak žiadna receptúra nemá 100
  if (!g || !g.mode || g.mode === 'none') return null;
  const disclosure = <p className="hint">Analyzér prevádzkuje Granula. Naše receptúry hodnotíme rovnakou verejnou metodikou ako všetky ostatné.</p>;
  if (g.mode === 'fits') {
    if (!g.recipeId) return null; // iná značka so 100/100 – nič neponúkame
    return (
      <section className="granula-block" aria-labelledby="granula-title">
        <h2 id="granula-title">Granule <span className="hl">pre psa {dogName}</span></h2>
        {disclosure}
        <div className="card stack">
          <p>Granula {g.name} sa psovi {dogName} hodí na 100 %. Objednať si ju môžeš priamo na granula.sk.</p>
          <a className="btn" href={orderUrl}>Objednať granule pre psa {dogName}</a>
        </div>
      </section>
    );
  }
  return (
    <section className="granula-block" aria-labelledby="granula-title">
      <h2 id="granula-title">Granule na mieru <span className="hl">pre psa {dogName}</span></h2>
      {disclosure}
      <div className="card stack">
        <div className="granula-head">
          {/* eslint-disable-next-line @next/next/no-img-element -- fotka z granula.sk, bez optimalizácie */}
          {g.img && <img src={g.img} alt={`Granula – ${g.name}`} width={120} height={120} />}
          <div>
            <p className="picked"><strong>Granula</strong> {g.name}</p>
            <p>{g.better ? `Pre psa ${dogName} sa hodí lepšie a má aj vyššie skóre zloženia.` : `Granule vyskladané podľa potrieb psa ${dogName}.`}</p>
            {g.why && <p className="hint">{g.why}</p>}
          </div>
        </div>
        <table className="compare">
          <thead><tr><th></th><th>{r.product ? displayName(r.product.brand, r.product.name) : 'Tvoje granule'}</th><th>Granula {g.name}</th></tr></thead>
          <tbody>
            <tr><th>Skóre zloženia</th><td>{r.score ?? '–'}/100</td><td>{g.score ?? '–'}/100</td></tr>
            <tr><th>Hodí sa pre psa {dogName}</th><td>{r.fit?.score ?? '–'}/100</td><td>{g.fit?.score ?? '–'}/100</td></tr>
            <tr><th>Mäso v granulách</th><td>{r.parts?.meat_pct != null ? `${r.parts.meat_pct} %` : 'neuvádza'}</td><td>{g.meat_pct != null ? `${g.meat_pct} %` : 'neuvádza'}</td></tr>
            <tr><th>Dávka denne</th><td>{r.dose ? `cca ${r.dose.grams} g` : '–'}</td><td>cca {g.grams} g</td></tr>
          </tbody>
        </table>
        <p>
          {dogName} by {female ? 'mala' : 'mal'} zjesť cca <strong>{g.grams} g denne</strong>
          {g.pricePerDay != null && <> · cca <strong>{g.pricePerDay.toFixed(2).replace('.', ',')} € na deň</strong> <span className="hint">(vrece {g.bagLabel}, s mesačným predplatným)</span></>}
        </p>
        <a className="btn" href={orderUrl}>Objednať granule pre psa {dogName}</a>
      </div>
    </section>
  );
}

/** Je na výsledku zobrazený blok Granula (odporúčanie alebo tlačidlo pri Granule so 100/100)? */
export function granulaBlockShown(r: StoredResult): boolean {
  const g = r.granula;
  return !!g && (g.mode === 'recommend' || (g.mode === 'fits' && !!g.recipeId));
}

/** Bod 9.1, časť 5: nenápadný riadok úplne dole – len keď nie je zobrazený blok Granula (aby odkaz nebol dvakrát). */
export function GranulaFooter({ r, dogName, url }: { r: StoredResult; dogName: string; url: string }) {
  if (granulaBlockShown(r)) return null;
  return (
    <p className="granula-footer">
      Granula – granule vyskladané na mieru pre každého psa. <a href={url}>Pozri, čo by sme vybrali pre psa {dogName} →</a>
    </p>
  );
}
