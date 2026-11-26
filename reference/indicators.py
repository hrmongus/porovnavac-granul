# Ukazovatele zloženia (metodika 2.0 – NÁVRH). Referenčná implementácia; TS port musí dávať rovnaké čísla.
import sys,re,json,statistics
sys.argv=['x']; sys.path.insert(0, __import__('os').path.dirname(__file__))
import ingredients_rules as R, scoring as S
MEATFORM=('-cerstve','-susene','-maso','-vnutor')
PROC_KEYS_SUFFIX=('-muck','-bielkov','-hydrolyz')
PROC_KEYS={'hrachove-frakcie','kukuricny-lepok','psenicny-lepok','soja','skrob','rastlinna-bielkovina-nespec','hydrolyzat-nespecifikovany',
 'oleje-a-tuky','rastlinny-olej-nespec','obilniny-nespec','zivocisne-vedlajsie','cukor','farbiva','konzervanty-synt'}
def pct(s):
    return [float(x.replace(',','.')) for x in re.findall(r'(\d+(?:[.,]\d+)?)\s*%',s)]
def meat_estimate(items):
    fresh=dry=0; any_pct=False; undeclared_meat=False
    for it in items:
        k=it.get('key') or ''
        if not k.endswith(MEATFORM): continue
        raw=R.deacc(it['raw'].lower())
        inner=re.findall(r'(\d+(?:[.,]\d+)?)\s*%\s*([a-z ]*?)(susen|dehydr|cerstv)',raw)
        if inner:
            for v,_,f in inner:
                v=float(v.replace(',','.')); any_pct=True
                if f=='cerstv' and 'susenom stave' not in raw: fresh+=v
                else: dry+=v
            continue
        p=it.get('percent')
        if p is None: undeclared_meat=True; continue
        any_pct=True
        f=k.rsplit('-',1)[1]
        if f=='cerstve' and 'susenom stave' not in raw: fresh+=p
        else: dry+=p   # susene, muck, bielkov, maso(nejasna forma -> ako uvedene)
    if not any_pct: return None
    tot_dry=fresh*0.25+(100-fresh)*0.9
    return round(100*(fresh*0.25+dry*0.9)/tot_dry), undeclared_meat
def processed_share(items):
    sc=[it for it in items if it['score'] is not None]
    n=len(sc); 
    if not n: return None
    rest=S.REST_WEIGHT/max(1,n-len(S.WEIGHTS)); w=[S.WEIGHTS[i] if i<len(S.WEIGHTS) else rest for i in range(n)]
    p=sum(wi for wi,it in zip(w,sc) if (it.get('key') or '').endswith(PROC_KEYS_SUFFIX) or it.get('key') in PROC_KEYS)
    return round(100*p/sum(w))
def transparency(items):
    sc=[it for it in items if it['score'] is not None][:10]
    if not sc: return None
    named=sum(1 for it in sc if it.get('classification')=='pomenovana')/len(sc)
    top3pct=sum(1 for it in sc[:3] if it.get('percent') is not None)/min(3,len(sc))
    return round(100*(0.6*named+0.4*top3pct))
def carbs(an):
    if not an: return None
    t=R.deacc(an.lower())
    def g(rx):
        m=re.search(rx+r'[^0-9]{0,25}(\d+(?:[.,]\d+)?)\s*%',t); return float(m.group(m.lastindex).replace(',','.')) if m else None
    p=g(r'(bielkov|protein|proteín|dusik)'); f=g(r'(tuk|fat)'); a=g(r'(popol|popel|ash)'); fi=g(r'(vlakn|fib)'); mo=g(r'(vlhk|vlhkost|voda|moist)')
    if None in (p,f,a,fi): return None
    mo=mo if mo is not None else 10
    return round(100-p-f-a-fi-mo,1)
def all_ind(comp,an=''):
    a=S.analyze(comp); it=a['items']
    m=meat_estimate(it)
    return dict(score=a['score'],meat=m[0] if m else None,proc=processed_share(it),transp=transparency(it),carbs=carbs(an))

WEIGHTS_V2 = dict(I=0.55, M=0.20, P=0.10, T=0.15)

def total_v2(comp, an=''):
    """Celkové skóre 2.0: 55 % kvalita surovín, 20 % mäso, 10 % spracovanosť, 15 % transparentnosť; stropy 49/69 ostávajú."""
    a = S.analyze(comp); it = a['items']
    sc = [x for x in it if x['score'] is not None]
    if not sc: return None
    n = len(sc); rest = S.REST_WEIGHT / max(1, n - len(S.WEIGHTS))
    w = [S.WEIGHTS[i] if i < len(S.WEIGHTS) else rest for i in range(n)]
    I = sum(wi * x['score'] for wi, x in zip(w, sc)) / sum(w)
    m = meat_estimate(it); proc = processed_share(it); tr = transparency(it)
    M = 30 if m is None else min(100, m[0] * 2)     # 50 % mäsa v hotových granulách = plný počet; neuvedené = 30
    P = max(0, 100 - 2 * proc)                      # 0 % spracovaných surovín = 100; 50 % a viac = 0
    t = WEIGHTS_V2['I']*I + WEIGHTS_V2['M']*M + WEIGHTS_V2['P']*P + WEIGHTS_V2['T']*tr
    if any(x['color'] == 'cervena' for x in sc[:5]): t = min(t, 49)
    if any(x['key'] in S.ARTIFICIAL for x in sc): t = min(t, 69)
    return dict(total=round(t), quality=round(I), meat_pct=m[0] if m else None, meat_points=M,
                processed_pct=proc, processed_points=P, transparency=tr, carbs_pct=carbs(an))
