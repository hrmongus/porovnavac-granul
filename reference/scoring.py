"""Výpočet skóre produktu zo zložiek (metodika 2.0).

Skóre = 55 % kvalita surovín + 20 % mäso + 10 % spracovanosť + 15 % transparentnosť;
stropy 49 (červená zložka medzi prvými piatimi) a 69 (umelé farbivo, syntetický konzervant, cukor).
Referenčná implementácia – lib/scoring/analyze.ts musí dávať rovnaké čísla.
"""
import re
from ingredients_rules import classify, deacc

VERSION = '2.0'
WEIGHTS = [30, 20, 15, 10, 8]          # váhy 1.–5. zložky (kvalita surovín)
REST_WEIGHT = 17                        # zvyšok sa delí rovnomerne medzi ostatné zložky
ARTIFICIAL = {'farbiva', 'syntet-konzervanty', 'cukor'}
PARTS = dict(quality=0.55, meat=0.20, processing=0.10, transparency=0.15)

MEAT_FORMS = ('-cerstve', '-susene', '-maso', '-vnutor')           # len pomenované mäso a vnútornosti
PROCESSED_SUFFIX = ('-muck', '-bielkov', '-hydrolyz')
PROCESSED_KEYS = {
    'zivocisne-vedlajsie-produkty', 'maso-nespecifikovane', 'hydrolyzat-nespecifikovany', 'ryby-vedlajsie-produkty',
    'pekarenske-vyrobky', 'rastlinne-vedlajsie-produkty', 'cukor', 'kukuricny-lepok', 'psenicny-lepok',
    'rastlinne-proteiny', 'hrachove-frakcie', 'skrob', 'celuloza', 'rastlinna-bielkovina-nespec', 'autolyzat',
    'tuk-zvysky', 'glycerin',
}


def split_top(s):
    out, buf, d = [], '', 0
    for i, ch in enumerate(s):
        if ch in '([': d += 1
        elif ch in ')]': d = max(0, d - 1)
        if ch in ',;' and d == 0 and not (0 < i < len(s) - 1 and s[i-1].isdigit() and s[i+1].isdigit()):
            out.append(buf); buf = ''
        else:
            buf += ch
    out.append(buf)
    return [x.strip(' .*') for x in out if x.strip(' .*')]


def position_weights(n):
    rest = REST_WEIGHT / max(1, n - len(WEIGHTS))
    return [WEIGHTS[i] if i < len(WEIGHTS) else rest for i in range(n)]


def meat_estimate(scored):
    """Odhad % mäsa v hotových granulách. None = výrobca neuvádza percentá mäsa."""
    fresh = dry = 0.0
    any_pct = False
    for it in scored:
        k = it.get('key') or ''
        if not k.endswith(MEAT_FORMS):
            continue
        raw = deacc(it['raw'])
        inner = re.findall(r'(\d+(?:[.,]\d+)?)\s*%\s*([a-z ]*?)(susen|dehydr|cerstv)', raw)
        if inner:
            for v, _, f in inner:
                v = float(v.replace(',', '.')); any_pct = True
                if f == 'cerstv' and 'susenom stave' not in raw: fresh += v
                else: dry += v
            continue
        p = it.get('percent')
        if p is None:
            continue
        any_pct = True
        if k.endswith('-cerstve') and 'susenom stave' not in raw: fresh += p
        else: dry += p
    if not any_pct:
        return None
    fresh = min(fresh, 100.0); dry = min(dry, 100.0 - fresh)          # nadradené + vnorené percentá nesmú presiahnuť 100
    total_dry = fresh * 0.25 + (100 - fresh) * 0.9     # čerstvé mäso ~75 % vody, ostatné suroviny ~10 %
    return max(0, min(100, round(100 * (fresh * 0.25 + dry * 0.9) / total_dry)))


def processed_share(scored, w):
    p = sum(wi for wi, it in zip(w, scored)
            if (it.get('key') or '').endswith(PROCESSED_SUFFIX) or it.get('key') in PROCESSED_KEYS)
    return round(100 * p / sum(w))


def transparency(scored):
    top = scored[:10]
    named = sum(1 for it in top if it.get('classification') == 'pomenovana') / len(top)
    top3 = sum(1 for it in top[:3] if it.get('percent') is not None) / min(3, len(top))
    return round(100 * (0.6 * named + 0.4 * top3))


def carbs_estimate(analytical):
    """Odhad sacharidov (NBE, %) z analytických zložiek – len informácia, nehodnotí sa."""
    if not analytical:
        return None
    t = deacc(analytical)
    def g(rx):
        m = re.search(rx + r'[^0-9]{0,25}(\d+(?:[.,]\d+)?)\s*%', t)
        return float(m.group(m.lastindex).replace(',', '.')) if m else None
    p = g(r'(bielkov|protein|dusik)'); f = g(r'(tuk|fat)'); a = g(r'(popol|popel|ash)')
    fi = g(r'(vlakn|fib)'); mo = g(r'(vlhk|voda|moist)')
    if None in (p, f, a, fi):
        return None
    return round(100 - p - f - a - fi - (mo if mo is not None else 10), 1)


def verdict_of(score):
    return ('Výborné zloženie' if score >= 90 else 'Kvalitné zloženie' if score >= 70
            else 'Slabšia kvalita zloženia' if score >= 50 else 'Nekvalitné zloženie')


def analyze(composition):
    items = []
    for raw in split_top(composition or ''):
        r = classify(raw)
        if r is None:            # zvyšok po spracovaní textu (nadpis, hmotnosť…)
            continue
        m = re.search(r'(\d+(?:[.,]\d+)?)\s*%', raw)
        items.append(dict(raw=raw, percent=float(m.group(1).replace(',', '.')) if m else None, **r))
    scored = [it for it in items if it['score'] is not None]
    if not scored:
        return dict(items=items, score=None, verdict=None, caps=[], parts=None)
    w = position_weights(len(scored))
    quality = sum(wi * it['score'] for wi, it in zip(w, scored)) / sum(w)
    meat_pct = meat_estimate(scored)
    processed_pct = processed_share(scored, w)
    transp = transparency(scored)
    meat_pts = 30 if meat_pct is None else min(100, meat_pct * 2)      # 50 % mäsa = plný počet; neuvedené = 30
    proc_pts = max(0, 100 - 2 * processed_pct)                        # 0 % = 100; 50 % a viac = 0
    score = (PARTS['quality'] * quality + PARTS['meat'] * meat_pts
             + PARTS['processing'] * proc_pts + PARTS['transparency'] * transp)
    caps = []
    if any(it['color'] == 'cervena' for it in scored[:5]):
        score = min(score, 49); caps.append('červená zložka medzi prvými piatimi → max. 49')
    if any(it['key'] in ARTIFICIAL for it in scored):
        score = min(score, 69); caps.append('umelé farbivo, syntetický konzervant alebo cukor → max. 69')
    score = round(score)
    parts = dict(quality=round(quality), meat_pct=meat_pct, meat=meat_pts,
                 processed_pct=processed_pct, processing=proc_pts, transparency=transp)
    return dict(items=items, score=score, verdict=verdict_of(score), caps=caps, parts=parts)
