"""Výpočet skóre produktu zo zložiek (metodika v1.0 – návrh)."""
import re
from ingredients_rules import classify

WEIGHTS = [30, 20, 15, 10, 8]          # váhy 1.–5. zložky
REST_WEIGHT = 17                        # zvyšok sa delí rovnomerne medzi ostatné zložky
ARTIFICIAL = {'farbiva', 'syntet-konzervanty', 'cukor'}

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
        return dict(items=items, score=None, verdict=None, caps=[])
    n = len(scored)
    rest = REST_WEIGHT / max(1, n - len(WEIGHTS))
    w = [WEIGHTS[i] if i < len(WEIGHTS) else rest for i in range(n)]
    score = sum(wi * it['score'] for wi, it in zip(w, scored)) / sum(w)
    caps = []
    if any(it['color'] == 'cervena' for it in scored[:5]):
        score = min(score, 49); caps.append('červená zložka medzi prvými piatimi → max. 49')
    if any(it['key'] in ARTIFICIAL for it in scored):
        score = min(score, 69); caps.append('umelé farbivo, syntetický konzervant alebo cukor → max. 69')
    score = round(score)
    verdict = ('Výborné zloženie' if score >= 90 else 'Kvalitné zloženie' if score >= 70
               else 'Slabšia kvalita zloženia' if score >= 50 else 'Nekvalitné zloženie')
    return dict(items=items, score=score, verdict=verdict, caps=caps)
