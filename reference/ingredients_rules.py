"""Pravidlá hodnotenia zložiek granúl (metodika v1.0 – návrh).

Každá zložka dostane: kanonický kľúč, názov, kategóriu, klasifikáciu, skóre 0–100,
farbu a vysvetlenie v ľudskej reči. Farby: zelená 90–100, žltá 70–89,
oranžová 50–69, červená 0–49. Nerozpoznaná zložka = šedá (nehodnotí sa, ide do fronty).
"""
import re, unicodedata

def color(score):
    if score is None: return 'seda'
    return 'zelena' if score >= 90 else 'zlta' if score >= 70 else 'oranzova' if score >= 50 else 'cervena'

def deacc(s):
    return unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()

# ---------- zvieratá (pomenovaný zdroj) ----------
ANIMALS = [  # (regex bez diakritiky, slovenský názov, alergén?)
    (r'kurac|kurat|kura\b|kure|kurec|kurc|chicken', 'kuracie', 'kuracie'),
    (r'morc|morka|morky|kruti|kruta|krocan|turkey', 'morčacie', None),
    (r'kacac|kacic|kack|kach|duck', 'kačacie', None),
    (r'husac|husi\b|hus\b|goose', 'husacie', None),
    (r'jahn|jehne|lamb|ovci|ovc', 'jahňacie', None),
    (r'hovad|hovez|beef|telac|telec|byvol|buvol|angus', 'hovädzie', None),
    (r'bravc|vepr|pork|diviak|divocak|kanec|iberic', 'bravčové', None),
    (r'kral|rabbit', 'králičie', None),
    (r'jelen|srn|dan[ie]e?l|zverin|venison|divina', 'zverina', None),
    (r'koz[ie]|kozi\b|goat', 'kozie', None),
    (r'kon[ie]|konsk|horse', 'konské', None),
    (r'prepelic|krepelk|quail', 'prepeličie', None),
    (r'pstruh|trout', 'pstruh', None),
    (r'losos|salmon', 'losos', None),
    (r'sled|slaď|herring|heryn|harin', 'sleď', None),
    (r'tresk|cod\b|treska', 'treska', None),
    (r'tuniak|tuna|tunak', 'tuniak', None),
    (r'sardin|sardel|ancov|anchov', 'sardinky', None),
    (r'makrel', 'makrela', None),
    (r'platesa|platyz|flounder|plaice', 'platesa', None),
    (r'kapor|kapr|carp', 'kapor', None),
    (r'krill|kril\b|krevet|shrimp|musl|slavk|perna', 'morské plody', None),
    (r'hmyz|insect|cvrc|larv|hermetia|mucha', 'hmyz', None),
    (r'biela ryba|bila ryba|white fish|whitefish|morske ryby|morskych ryb', 'biela morská ryba', None),
]
FISH_GENERIC = r'\bryb|\bryby|fish'
POULTRY_GENERIC = r'hydin|drub|poultry'
MEAT_GENERIC = r'\bmas[oa]\b|\bmaso\b|meat|\bmase\b|masov'

def animal_of(t):
    for rx, name, allerg in ANIMALS:
        if re.search(rx, t): return name, allerg
    return None, None

# ---------- slovník konkrétnych zložiek (poradie = priorita) ----------
# (regex na text bez diakritiky, kľúč, názov, kategória, klasifikácia, skóre, vysvetlenie, citlivosť)
D = [
 # --- nešpecifikované živočíšne zdroje (červené) ---
 (r'vedlajsie produkty|vedlajsich produkt|vedlejsi produkt|by-product|by product|derivat|odvodene|odvozene', 'zivocisne-vedlajsie-produkty', 'Živočíšne vedľajšie produkty / deriváty', 'zivocisny_vedlajsi_produkt', 'nespecifikovana', 15,
  'Súhrnné označenie pre časti zvierat, ktoré nie sú svalovinou (môžu to byť vnútornosti, ale aj menej hodnotné časti). Etiketa neuvádza, z akého zvieraťa ani z akých častí – nedá sa overiť, čo pes naozaj je.', None),
 (r'^masa?( a| &)? ?zivocis|^maso a|^masove? mucky|^mas[ao]vá? mucka|^masova mucka|^zivocisne bielkoviny$|^zivocisna bielkovina|^zivocisne proteiny|^zivocisne mucky|^mucka zo zivocis', 'maso-nespecifikovane', 'Mäso / mäsová múčka bez uvedenia zvieraťa', 'zivocisny_vedlajsi_produkt', 'nespecifikovana', 20,
  'Mäso alebo múčka bez uvedenia, z akého zvieraťa pochádza. Pri alergii sa nedá overiť a nie je jasná ani kvalita surovín.', None),
 (r'^hydrolyzovany protein|^zdroje bielkovin|^lahko stravitelne bielkoviny|hydrolyz.*zivocis|zivocis.*hydrolyz|^hydrolyzovane bielkoviny$|^bielkovinovy hydrolyzat|^proteinovy hydrolyzat|^hydrolyzat bielkovin', 'hydrolyzat-nespecifikovany', 'Hydrolyzované bielkoviny (bez uvedenia zdroja)', 'zivocisny_vedlajsi_produkt', 'nespecifikovana', 40,
  'Bielkoviny rozložené na menšie časti – zlepšujú chuť a sú ľahšie stráviteľné. Nie je však uvedené, z čoho pochádzajú, takže sa nedá overiť pôvod ani vhodnosť pri alergii.', None),
 (r'^zivocisn[ey] tuky?$|^zivocisne tuky|^tuky? zivocis|^zivocisny tuk', 'zivocisny-tuk-nespecifikovany', 'Živočíšny tuk (bez uvedenia zvieraťa)', 'tuk_olej', 'nespecifikovana', 30,
  'Tuk zo zvierat bez uvedenia druhu. Dodáva energiu a chuť, ale nevieme, odkiaľ pochádza.', None),
 (r'^oleje a tuky|^tuky a oleje|^oleje$|^tuky$', 'oleje-a-tuky', 'Oleje a tuky (bez uvedenia zdroja)', 'tuk_olej', 'nespecifikovana', 20,
  'Zmes tukov a olejov bez uvedenia, či sú živočíšne alebo rastlinné a z čoho. Výrobca tak môže meniť suroviny bez zmeny etikety.', None),
 (r'^ryby a vedlajsie|^ryby a produkty|^ryby a derivat|^rybie vedlajsie', 'ryby-vedlajsie-produkty', 'Ryby a vedľajšie produkty z rýb', 'zivocisny_vedlajsi_produkt', 'nespecifikovana', 25,
  'Ryby a ich zvyšky bez uvedenia druhu. Nevieme, aké ryby ani aké časti obsahuje.', None),
 (r'pekarensk|pecivo|chlieb', 'pekarenske-vyrobky', 'Pekárenské výrobky', 'ine', 'nespecifikovana', 15,
  'Zvyšky pečiva a pekárenských výrobkov. Lacný zdroj škrobu bez výživovej pridanej hodnoty pre psa.', None),
 (r'vedlajsie rastlin|vedlajs.*rastlin|produkty zo spracovania rastlin|specificke zlozky|rastlinne vedlajs|rastlinneho povodu|zeleninove vedlajs|^derivaty rastl|^vedlajsie produkty rastl', 'rastlinne-vedlajsie-produkty', 'Vedľajšie produkty rastlinného pôvodu', 'ine', 'nespecifikovana', 15,
  'Zvyšky zo spracovania rastlín bez bližšieho určenia. Nevieme, čo presne obsahuje.', None),
 # --- umelé a cukry (červené) ---
 (r'farbiv|farbiaci|barvivo|colorant|e1[0-9]{2}\b|tartrazin|oxid titanic', 'farbiva', 'Farbivá', 'prisada', 'spracovana', 5,
  'Farbivo pridané kvôli vzhľadu granúl. Pre psa nemá žiadnu funkciu – je tam pre oko človeka.', None),
 (r'^konzervant|^konzervacne latky|\bbha\b|\bbht\b|etoxych|ethoxyqu|propylgal|propylenglyk|propylene glyc|\be32[01]\b|\be324\b|sorban draseln|benzoan', 'syntet-konzervanty', 'Syntetické konzervanty / antioxidanty', 'prisada', 'spracovana', 5,
  'Syntetická konzervačná látka. V kvalitných krmivách sa namiesto nej používajú prírodné antioxidanty (napr. tokoferoly, rozmarín).', None),
 (r'cukor|cukry|sacharoz|glukozov[yý] sirup|karamel|melasa|melas|med\b|dextroz|fruktoz(?!o)', 'cukor', 'Cukor / sladidlá', 'prisada', 'spracovana', 10,
  'Pridaný cukor alebo sladidlo – zlepšuje chuť, ale pes ho vo výžive nepotrebuje a prispieva k nadváhe a zubnému kameňu.', None),
 (r'^ochucov|^arom|^aromat|^chutov|^flavou?r|zvyraznovac chut|glutaman', 'aromy', 'Arómy (bez uvedenia zdroja)', 'prisada', 'nespecifikovana', 30,
  'Látky na zlepšenie chuti a vône. Ak nie je uvedené, z čoho sú, nevieme posúdiť ich pôvod.', None),
 (r'prirodn[ae] arom|prirodne aromat|natural flavou?r|^digest|pecenovy digest', 'prirodne-aromy', 'Prírodné arómy / digest', 'prisada', 'spracovana', 60,
  'Prírodné chuťové látky (často z hydrolyzovaných živočíšnych tkanív). Zlepšujú chuť, ale často sa neuvádza zdroj.', None),
 # --- obilniny a ich frakcie ---
 (r'kukuric.*(lepok|glut|bielkovin|protein)|corn gluten|maize gluten', 'kukuricny-lepok', 'Kukuričný lepok / kukuričná bielkovina', 'obilnina', 'spracovana', 35,
  'Bielkovinová frakcia z kukurice, zvyšok po výrobe škrobu. Lacne zvyšuje číslo „bielkoviny“ na etikete, ale rastlinná bielkovina je pre psa menej hodnotná ako živočíšna.', 'obilniny'),
 (r'psenic.*(lepok|glut|bielkovin|protein)|wheat gluten', 'psenicny-lepok', 'Pšeničný lepok', 'obilnina', 'spracovana', 35,
  'Bielkovina z pšenice. Lacne zvyšuje obsah bielkovín na etikete; pre psy citlivé na lepok nevhodná.', 'obilniny'),
 (r'^obilnin|^obilie|^cereal|^zmes obilnin', 'obilniny-nespecifikovane', 'Obilniny (bez uvedenia druhu)', 'obilnina', 'nespecifikovana', 30,
  'Obilniny bez uvedenia, o ktoré ide. Výrobca môže ich zloženie meniť podľa ceny suroviny.', 'obilniny'),
 (r'kukur|corn|maize', 'kukurica', 'Kukurica', 'obilnina', 'pomenovana', 55,
  'Obilnina, lacný zdroj energie (škrobu) a pojivo granúl. Nutrične slabšia ako mäso; ak je vysoko v zložení, granula je postavená skôr na obilí ako na mäse.', 'obilniny'),
 (r'psenic|wheat|psenice', 'psenica', 'Pšenica', 'obilnina', 'pomenovana', 50,
  'Obilnina, lacný zdroj energie a pojivo. Obsahuje lepok – niektoré psy na ňu reagujú citlivo (trávenie, koža).', 'obilniny'),
 (r'soj|soya|soy\b|soybean', 'soja', 'Sója / sójová múka', 'strukovina', 'pomenovana', 40,
  'Lacný rastlinný zdroj bielkovín. Zvyšuje číslo bielkovín na etikete, je častým alergénom a môže spôsobovať plynatosť.', 'strukoviny'),
 (r'(ryz|ovsen|psenic|kukuric).*otrub', 'otruby', 'Otruby', 'vlaknina', 'pomenovana', 65,
  'Obalové časti zŕn – zdroj vlákniny. Výživovo málo hodnotné.', 'obilniny'),
 (r'hneda ryz|celozrnn[aá] ryz|natural rice|brown rice|ryza natural', 'hneda-ryza', 'Hnedá / celozrnná ryža', 'obilnina', 'pomenovana', 85,
  'Celozrnná ryža – zdroj energie a vlákniny, dobre stráviteľná.', 'obilniny'),
 (r'ryz|rice|rys\b|ryze', 'ryza', 'Ryža', 'obilnina', 'pomenovana', 80,
  'Ľahko stráviteľný zdroj energie (sacharidov), vhodný aj pre citlivé trávenie.', 'obilniny'),
 (r'ovos|oves|ovsen|oat', 'ovos', 'Ovos / ovsené vločky', 'obilnina', 'pomenovana', 78,
  'Obilnina s vlákninou a beta-glukánmi, šetrná k tráveniu.', 'obilniny'),
 (r'jacm|jecm|barley', 'jacmen', 'Jačmeň', 'obilnina', 'pomenovana', 72,
  'Obilnina, zdroj energie a vlákniny. Obsahuje lepok.', 'obilniny'),
 (r'quino|spald|spelt|proso|millet|jahl|cirok|sorghum|pohan|buckwheat|quinoa|kinoa|amarant|tritikal|raz\b|rasz|zito|rye', 'ine-obilniny', 'Proso / cirok / špalda / pohánka / quinoa', 'obilnina', 'pomenovana', 75,
  'Menej bežná obilnina alebo pseudoobilnina – zdroj energie a vlákniny.', 'obilniny'),
 # --- strukoviny ---
 (r'hrach.*(protein|bielkov|skrob|vlakn|muck|fiber|starch)|hras.*(protein|bielkov|skrob|vlakn|muck)|pea (protein|starch|fib)', 'hrachove-frakcie', 'Hrachová bielkovina / škrob / vláknina', 'strukovina', 'spracovana', 55,
  'Časť hrachu oddelená pri spracovaní. Hrachová bielkovina lacne zvyšuje obsah bielkovín na etikete, škrob slúži ako pojivo. Ak je ich v zložení viac, môžu „rozdeliť“ hrach, aby nebol na prvom mieste.', 'strukoviny'),
 (r'hrach|hras|pea\b|peas\b', 'hrach', 'Hrach / hrášok', 'strukovina', 'pomenovana', 70,
  'Strukovina – zdroj energie, vlákniny a rastlinnej bielkoviny. Bežná náhrada obilia v krmivách „bez obilnín“.', 'strukoviny'),
 (r'sosovic|cocka|lentil|cicer|cizrn|chickpea|fazul|fazol|bean|bob\b|lupin|vlcí bob', 'ine-strukoviny', 'Šošovica / cícer / fazuľa', 'strukovina', 'pomenovana', 72,
  'Strukovina – zdroj energie, vlákniny a rastlinnej bielkoviny.', 'strukoviny'),
 # --- zemiaky a škroby ---
 (r'sladk[eé] zemiak|batat|sweet potato|kukurydz', 'batat', 'Batáty (sladké zemiaky)', 'zelenina_ovocie', 'pomenovana', 85,
  'Zdroj energie a vlákniny s pomalším uvoľňovaním cukrov, dobre stráviteľný.', None),
 (r'skrob|starch|tapiok|tapioc|maniok|cassava', 'skrob', 'Škrob (zemiakový, tapiokový…)', 'ine', 'spracovana', 55,
  'Čistý škrob – pojivo, ktoré drží granulu pokope, a lacný zdroj energie. Výživovo chudobný.', None),
 (r'zemiak|brambor|potato', 'zemiaky', 'Zemiaky / zemiakové vločky', 'zelenina_ovocie', 'pomenovana', 70,
  'Zdroj energie (škrobu), bežná náhrada obilia v krmivách bez obilnín.', None),
 # --- vláknina ---
 (r'lignocel|celuloz|cellulos|drevit', 'celuloza', 'Celulóza / lignocelulóza', 'vlaknina', 'spracovana', 50,
  'Nerozpustná vláknina (často z dreva). Pomáha pri sýtosti a tvorbe stolice, ale nemá výživovú hodnotu – vo väčšom množstve je to plnivo.', None),
 (r'^(?!.*cerven).*(repn|repne|repy\b|repa\b|cukrov[a]? rep|beet)', 'repna-duzina', 'Repná dužina / repné rezky', 'vlaknina', 'spracovana', 75,
  'Vláknina z cukrovej repy (cukor je odstránený). Podporuje trávenie a pevnú stolicu.', None),
 (r'psyllium|plantago|skorocel', 'psyllium', 'Psyllium (skorocel)', 'vlaknina', 'pomenovana', 85,
  'Rozpustná vláknina, ktorá reguluje trávenie a stolicu.', None),
 (r'otrub|bran\b', 'otruby', 'Otruby', 'vlaknina', 'pomenovana', 65,
  'Obalové časti zŕn – zdroj vlákniny. Výživovo málo hodnotné.', 'obilniny'),
 # --- prebiotiká, funkčné ---
 (r'cakank|cekank|inulin|chicor|frukto.?oligo|fos\b|manan|mannan|mos\b|glukan|oligosachar|prebiot|bunkove steny kvas', 'prebiotika', 'Prebiotiká (čakanka, inulín, FOS, MOS)', 'vlaknina', 'pomenovana', 92,
  'Látky, ktoré slúžia ako potrava pre prospešné črevné baktérie a podporujú zdravé trávenie a imunitu.', None),
 (r'skorapk|skořápk|koryš|korys|glukozam|glukosam|glucosam|chondroit|kolagen|collagen|zelenoust|zelenoš|green.?lipped|msm\b|metylsulfonyl|chrupav|cartilag', 'klby', 'Glukozamín / chondroitín / kolagén', 'prisada', 'pomenovana', 92,
  'Látky prirodzene sa vyskytujúce v chrupavkách. Pridávajú sa na podporu kĺbov.', None),
 (r'pivovar|brewer|kvasn|drozdi|kvasinky|yeast|saccharomyc', 'kvasnice', 'Kvasnice / pivovarské kvasnice', 'prisada', 'pomenovana', 85,
  'Zdroj vitamínov skupiny B, bielkovín a látok podporujúcich imunitu. Zlepšujú aj chuť.', None),
 (r'deaktivovane bakter|probiot|enterococc|lactobac|bacillus|bifido|postbiot', 'probiotika', 'Probiotiká / postbiotiká', 'prisada', 'pomenovana', 92,
  'Prospešné baktérie (alebo ich produkty) na podporu črevnej mikroflóry.', None),
 (r'yuc+a|juk[aoy]|juky', 'yucca', 'Yucca schidigera', 'prisada', 'pomenovana', 88,
  'Výťažok z rastliny yucca – znižuje zápach stolice a podporuje trávenie.', None),
 (r'rias|ras[ay]\b|riasy|riasa|kelp|chaluh|spirulin|chlorel|alga|schizochytr|morsk[aá] trav|seaweed', 'riasy', 'Morské riasy / spirulina', 'prisada', 'pomenovana', 88,
  'Prírodný zdroj minerálov, jódu a pri niektorých riasach aj omega-3 mastných kyselín.', None),
 (r'vajc|vajec|vejc|egg', 'vajcia', 'Vajcia', 'maso', 'pomenovana', 92,
  'Vysoko stráviteľná živočíšna bielkovina s výbornou biologickou hodnotou.', None),
 (r'mliek|mlec|syr\b|syrov|srvatk|whey|milk|cheese|jogurt|tvaroh', 'mliecne', 'Mlieko a mliečne výrobky', 'ine', 'pomenovana', 55,
  'Mliečne zložky zlepšujú chuť. Dospelé psy však laktózu často zle trávia.', None),
 # --- minerály a soli ---
 (r'mineral|nerast', 'mineralne-latky', 'Minerálne látky', 'vitaminy_mineraly', 'nespecifikovana', 75,
  'Zmes minerálov (vápnik, fosfor, sodík…) potrebná pre kompletnú výživu. Bežné, ale bez bližšieho rozpisu.', None),
 (r'chlorid sodn|kuchynsk[aá] sol|\bsol\b|soľ|sodium chlor', 'sol', 'Soľ (chlorid sodný)', 'vitaminy_mineraly', 'pomenovana', 70,
  'Zdroj sodíka. V malom množstve potrebná, vo väčšom zlepšuje chuť a zvyšuje pitie.', None),
 (r'chlorid drasel|uhlicitan vapen|fosforecnan|fosfat|vapnik|kalcium|calcium|draslik|horcik|magnez|oxid horecn|vajecne skrup|vajecn[aá] skrup|egg ?shell|kostn[aá] mucka', 'mineraly-konkretne', 'Konkrétne minerály (vápnik, draslík, fosfor…)', 'vitaminy_mineraly', 'pomenovana', 85,
  'Konkrétne uvedený minerál potrebný na vyváženie výživy.', None),
 (r'vit\. ?[a-z]|nukleotid|vitamin|taurin|karnitin|carnitin|cholin|biotin|niacin|kyselina listov|pantoten|lysin|metionin|tryptofan|aminokysel', 'vitaminy', 'Vitamíny / aminokyseliny', 'vitaminy_mineraly', 'pomenovana', 90,
  'Doplnené vitamíny alebo aminokyseliny, ktoré zabezpečujú kompletnú výživu.', None),
 (r'^antioxidanty?$|^antioxidacne latky$|^konzervacne latky a antioxid', 'antioxidanty-nespec', 'Antioxidanty (bez uvedenia druhu)', 'prisada', 'nespecifikovana', 50,
  'Látky chrániace tuky pred žltnutím. Nie je uvedené, či ide o prírodné (tokoferoly, rozmarín) alebo syntetické.', None),
 (r'tokoferol|rozmarin.*extrakt|extrakt z rozmar|vytazok z rozmar|rosemary|antioxid|kyselina citron|askorb', 'prirodne-antioxidanty', 'Prírodné antioxidanty (tokoferoly, rozmarín)', 'prisada', 'pomenovana', 90,
  'Prírodné látky, ktoré chránia tuky v granulách pred žltnutím. Lepšia alternatíva syntetických konzervantov.', None),
 # --- oleje a tuky rastlinné ---
 (r'lanov|lnen|lnene|linseed|flax', 'lan', 'Ľanové semienko / ľanový olej', 'tuk_olej', 'pomenovana', 90,
  'Zdroj omega-3 mastných kyselín (ALA) a vlákniny – podporuje kožu a srsť.', None),
 (r'palmov|palm\b|palm oil', 'palmovy-olej', 'Palmový olej', 'tuk_olej', 'pomenovana', 45,
  'Lacný rastlinný tuk s nízkym obsahom esenciálnych mastných kyselín. Pre psa výživovo málo prínosný.', None),
 (r'sojov[yý] olej|soy(bean)? oil', 'sojovy-olej', 'Sójový olej', 'tuk_olej', 'pomenovana', 60,
  'Rastlinný olej, zdroj omega-6 mastných kyselín. Lacnejšia alternatíva k rybím olejom.', None),
 (r'slnecnic|slunecnic|sunflower|repkov|repkovy|rapeseed|canola|kukuricn[yý] olej|svetlicov|safflower|konopn|hemp|kokos|coconut|olivov|olive|pupalk|borak|ostropest[rř]|chia|tekvicov[eé] semi|semienk', 'rastlinne-oleje-semena', 'Rastlinné oleje a semená (slnečnica, repka, konope…)', 'tuk_olej', 'pomenovana', 75,
  'Konkrétne pomenovaný rastlinný olej alebo semeno – zdroj energie a mastných kyselín.', None),
 (r'rastlinn[yý] olej|rastlinne oleje|rastlinny tuk|rastlinne tuky|vegetable oil', 'rastlinny-olej-nespec', 'Rastlinný olej (bez uvedenia zdroja)', 'tuk_olej', 'nespecifikovana', 40,
  'Rastlinný olej bez uvedenia, z akej rastliny je. Nevieme posúdiť jeho kvalitu ani pomer mastných kyselín.', None),
 # --- zelenina, ovocie, bylinky ---
 (r'cerven[a]? rep|mrkv|tekvic|dyne|dýn|pumpkin|carrot|spenat|spinach|brokol|kapust|kel\b|cuket|zucchin|petrzl|parsley|zeler|celer|cvikl|repa cerven|paradajk|rajc|tomat|hrasok zelen|zelenin|vegetab|pastrnak|pastinak|cibul|fenikel|fenykl|artici|spargl|pazitk|redkev|salat|pazit|batat', 'zelenina', 'Zelenina', 'zelenina_ovocie', 'pomenovana', 90,
  'Zelenina dodáva vlákninu, vitamíny a antioxidanty. Zvyčajne je jej v granulách malé množstvo.', None),
 (r'svestk|merun|jablk|jablc|jablec|apple|hrus|pear|brusnic|cranberr|cucoried|boruvk|blueberr|malin|raspberr|jahod|strawb|rakytn|sea ?buckthorn|sipk|rose ?hip|baz|elderb|aron|ostruzin|cerni|banan|ovoc|fruit|citrus|pomaran|grep|granat|goji|acerol|ribezl|ribez|visn|ceresn|slivk|marhul|mango|papay|ananas|datl', 'ovocie', 'Ovocie a bobuľoviny', 'zelenina_ovocie', 'pomenovana', 90,
  'Ovocie a bobuľoviny sú zdrojom vitamínov a antioxidantov. V granulách býva v malom množstve.', None),
 (r'rozmaryn|korian|grifola|tanin|rozmarin|tymian|kurkum|turmeric|zazvor|ginger|petrzlen|bazalk|oregan|harmanc|camomil|chamomil|medovk|mata|mint|zihlav|nettle|pestrec|silymar|milk thistle|lopuch|burdock|pupava|dandelion|levand|lavend|ibis|marshmallow|alfalfa|lucern|bylin|herb|koren|root|klincek|clove|skorica|cinnamon|cesnak|garlic|kmin|anyz|horc|imel|rebrick|cernic|zemezl|echinac|ginkgo|ginseng|sedmokr|nechtik|marigold|ostruzin|zihlav|reishi|shiitake|hliv|huby|mushroom', 'bylinky', 'Bylinky a koreniny', 'prisada', 'pomenovana', 88,
  'Bylinky a koreniny pridané v malom množstve pre chuť alebo podporu trávenia. Na celkovú výživu majú malý vplyv.', None),
]

JUNK = re.compile(r'^(\d+([.,]\d+)? ?kg\b|\)|zlozky$|prirodne prisady|zlozenie|slozeni|= ?prirodn|prirodne zlozky|vlhkost|popol|hrub[ya] (popol|vlaknina|tuk|protein)|dostupne balenia|kompletne krmivo|dopln?kove krmivo|susene$|cerstve$|pridavne|technologick|nutricne|analyticke|obsah|metabolizovatel|energia|semena$|semienka$)')
EXTRA = [
 (r'hydrolyz.*pecen|^pecen|^pecene|hydrolyzovane pecene', 'pecen-nespecifikovana', 'Pečeň (bez uvedenia zvieraťa)', 'zivocisny_vedlajsi_produkt', 'spracovana', 65,
  'Pečeň bez uvedenia zvieraťa – výživovo hodnotná a chutná, ale nevieme, z akého zvieraťa pochádza.', None),
 (r'rastlinn[eaá] bielkovin|bielkovinov[yý] (izolat|extrakt)|rastlinny protein|rastlinne proteiny', 'rastlinna-bielkovina-nespec', 'Rastlinná bielkovina (bez uvedenia zdroja)', 'ine', 'nespecifikovana', 45,
  'Bielkovina z rastlín bez uvedenia, z akých. Lacne zvyšuje obsah bielkovín na etikete; pre psa je menej hodnotná ako živočíšna.', None),
 (r'autolyzat', 'autolyzat', 'Autolyzát (bez uvedenia zdroja)', 'prisada', 'nespecifikovana', 45,
  'Produkt samovoľného rozkladu bielkovín (napr. kvasníc alebo mäsa), slúži na zlepšenie chuti. Zdroj nie je uvedený.', None),
 (r'kostn[yý] tuk|skvark|lojov|sadlo', 'tuk-zvysky', 'Kostný tuk / škvarky (bez uvedenia zvieraťa)', 'tuk_olej', 'nespecifikovana', 35,
  'Tuk získaný zo zvyškov (kosti, škvarky) bez uvedenia zvieraťa. Zdroj energie a chuti, ale nízkej a neoveriteľnej kvality.', None),
 (r'glycerin|glycerol|sorbitol|zelatin|gelatin', 'glycerin', 'Glycerín / sorbitol', 'prisada', 'spracovana', 55,
  'Látka udržiavajúca vlhkosť a mäkkosť granúl. Pre výživu psa nemá význam.', None),
 (r'lecitin|lecithin', 'lecitin', 'Lecitín', 'prisada', 'pomenovana', 80,
  'Prírodný emulgátor (zvyčajne zo sóje alebo slnečnice), zdroj fosfolipidov.', None),
 (r'klinoptilol|zeolit|bentonit|rasel|humin|humac|montmorillon|kremelin|diatom', 'ilove-mineraly', 'Íly a ílové minerály (zeolit, rašelina, humínové látky)', 'vitaminy_mineraly', 'pomenovana', 70,
  'Prírodné látky, ktoré viažu toxíny a pomáhajú pri trávení a pevnej stolici.', None),
 (r'^vlaknin|rastlinn[aá] vlaknin|^vlaknina|psylli|cukrovarsk[eé] rezk', 'vlaknina-rastlinna', 'Rastlinná vláknina', 'vlaknina', 'nespecifikovana', 70,
  'Vláknina z rastlín bez bližšieho určenia – podporuje trávenie a pocit sýtosti.', None),
 (r'caj|green tea|aloe|aksamiet|anyz|aniz|salvi|salvej|sipok|kvaka|kvak|hrebicek|rasc|zeruch|karob|carob|svatojanskeho|citron|limet', 'bylinky2', 'Bylinky, čaj a rastlinné extrakty', 'prisada', 'pomenovana', 88,
  'Bylinky a rastlinné extrakty pridané v malom množstve pre chuť alebo podporu trávenia a imunity.', None),
 (r'lesne plody|lesne bobul|brusink|bobul', 'ovocie2', 'Lesné plody a bobuľoviny', 'zelenina_ovocie', 'pomenovana', 90,
  'Bobuľoviny sú zdrojom vitamínov a antioxidantov. V granulách býva v malom množstve.', None),
 (r'fosfor|zelezo|zinok|med\b|mangan|jod|selen|uhlicitan|draslik|sodik|horcik|vapnik|sirany?|oxid', 'mineraly-konkretne', 'Konkrétne minerály (vápnik, draslík, fosfor…)', 'vitaminy_mineraly', 'pomenovana', 85,
  'Konkrétne uvedený minerál potrebný na vyváženie výživy.', None),
 (r'chondroprotekt|omega|\bdha\b|\bepa\b', 'klby', 'Glukozamín / chondroitín / kolagén', 'prisada', 'pomenovana', 92,
  'Látky na podporu kĺbov, srsti a kože pridávané do krmiva.', None),
 (r'kvasinkov|kvasnicov', 'kvasnice', 'Kvasnice / pivovarské kvasnice', 'prisada', 'pomenovana', 85,
  'Zdroj vitamínov skupiny B, bielkovín a látok podporujúcich imunitu. Zlepšujú aj chuť.', None),
]

def explain_meat(animal, form):
    base = {
        'cerstve': f'Čerstvé {animal} mäso – konkrétne pomenovaný zdroj živočíšnych bielkovín. Pozor: čerstvé mäso obsahuje asi 70 % vody, takže po vysušení ho v granule zostane podstatne menej, než ukazuje percento na obale.',
        'susene': f'Sušené (dehydrované) {animal} mäso – konkrétne pomenovaný a koncentrovaný zdroj živočíšnych bielkovín. Percento na obale tu zodpovedá skutočnému podielu v granule lepšie ako pri čerstvom mäse.',
        'muck': f'Múčka z {animal} mäsa – mäso (často aj s kosťami) usušené a zomleté. Pomenovaný a koncentrovaný zdroj bielkovín, no kvalita závisí od toho, aké časti zvieraťa sa použili.',
        'hydrolyz': f'Hydrolyzovaná {animal} bielkovina – bielkovina rozložená na menšie časti, ľahko stráviteľná a menej alergizujúca. Zdroj je pomenovaný.',
        'bielkov': f'{animal.capitalize()} bielkovina / proteín – koncentrovaný a pomenovaný živočíšny zdroj bielkovín (sušené a odtučnené mäso).',
        'vnutor': f'{animal.capitalize()} vnútornosti (pečeň, srdce, žalúdky…) – pomenované a výživovo veľmi hodnotné, prirodzene bohaté na vitamíny a minerály.',
        'tuk': f'{animal.capitalize()} tuk / olej – pomenovaný zdroj energie a mastných kyselín.',
        'maso': f'{animal.capitalize()} mäso – konkrétne pomenovaný zdroj živočíšnych bielkovín.',
        'vyvar': f'{animal.capitalize()} vývar / omáčka – zlepšuje chuť, výživovo je doplnkom.',
    }
    return base[form]

MUSSEL = r'musl|slavk|perna|zelenoust|green.?lipped'
MEAT_SCORES = {'cerstve': 100, 'susene': 100, 'maso': 100, 'vnutor': 97, 'hydrolyz': 85, 'bielkov': 90, 'muck': 40, 'tuk': 85, 'vyvar': 75}
FAT_FISH = {'losos': 92, 'sleď': 90, 'treska': 88, 'sardinky': 90, 'makrela': 90, 'pstruh': 90, 'morské plody': 90}

def form_of(t):
    if re.search(r'tuk|olej|oil|fat|loj\b|sadl', t): return 'tuk'
    if re.search(r'hydrolyz', t): return 'hydrolyz'
    if re.search(r'muck|moucka|meal', t) and not re.search(r'susen', t): return 'muck'
    if re.search(r'bielkovin|protein|proteín|bilkovin', t): return 'bielkov'
    if re.search(r'pecen|jater|srdc|zaludk|ladvin|droby|vnutor|liver|heart|gizzard|tripe|bachor|pluc|slezin|krk[yu]|chrupav', t): return 'vnutor'
    if re.search(r'vyvar|omack|broth|stock|gravy|bujon', t): return 'vyvar'
    if re.search(r'cerstv|fresh|surov|mrazen|chlazen|vykost|deboned|raw', t): return 'cerstve'
    if re.search(r'susen|dehydr|dried|vysus', t): return 'susene'
    return 'maso'

def classify(raw):
    """Vráti dict: key, name, category, classification, score, color, explanation, sensitivity."""
    t = deacc(re.sub(r'\([^)]*\)|\[[^\]]*\]', '', raw)).strip(' .,:;*')
    t = re.sub(r'\d+([.,]\d+)?\s*(%|mg/kg|g/kg|mg|iu|ie|m\.j\.)', '', t).strip()
    if not t or JUNK.search(t) or len(t) < 3:
        return None
    # 1) nešpecifikované / umelé majú prednosť
    for rx, key, name, cat, cls, sc, expl, sens in D[:12]:
        if re.search(rx, t):
            return dict(key=key, name=name, category=cat, classification=cls, score=sc, color=color(sc), explanation=expl, sensitivity=sens)
    # 1b) zelenoústa mušľa = doplnok na kĺby, nie mäso
    if re.search(MUSSEL, t):
        for rx, key, name, cat, cls, sc, expl, sens in D:
            if key == 'klby':
                return dict(key=key, name=name, category=cat, classification=cls, score=sc, color=color(sc), explanation=expl, sensitivity=sens)
    # 2) pomenované zviera
    animal, allerg = animal_of(t)
    is_fishy = re.search(FISH_GENERIC, t)
    if animal or re.search(POULTRY_GENERIC, t) or is_fishy or re.search(MEAT_GENERIC, t):
        f = form_of(t)
        if animal:
            sc = MEAT_SCORES[f]
            if f == 'tuk': sc = FAT_FISH.get(animal, 85)
            cat = 'tuk_olej' if f == 'tuk' else 'maso'
            cls = 'pomenovana' if f in ('cerstve', 'susene', 'maso', 'vnutor', 'tuk', 'vyvar') else 'spracovana'
            sens = 'kuracie' if allerg else None
            key = f'{deacc(animal).replace(" ", "-")}-{f}'
            name = {'cerstve': f'{animal} mäso (čerstvé)', 'susene': f'{animal} mäso (sušené)', 'maso': f'{animal} mäso',
                    'vnutor': f'{animal} vnútornosti', 'hydrolyz': f'{animal} hydrolyzovaná bielkovina', 'bielkov': f'{animal} bielkovina',
                    'muck': f'{animal} múčka', 'tuk': f'{animal} tuk / olej', 'vyvar': f'{animal} vývar'}[f].capitalize()
            expl = explain_meat(animal, f)
            if allerg: expl += ' Kuracie je kvalitné mäso, ale patrí medzi častejšie alergény u psov.'
            return dict(key=key, name=name, category=cat, classification=cls, score=sc, color=color(sc), explanation=expl, sensitivity=sens)
        # čiastočne pomenované: hydina / ryby všeobecne
        if re.search(POULTRY_GENERIC, t):
            sc = {'tuk': 78, 'muck': 30, 'hydrolyz': 65, 'bielkov': 70}.get(f, 80)
            return dict(key=f'hydina-{f}', name=f'Hydina ({f})', category='tuk_olej' if f == 'tuk' else 'maso', classification='spracovana', score=sc, color=color(sc),
                        explanation='Hydina bez uvedenia druhu (kura, morka, kačica…). Je to živočíšny zdroj, ale presné zviera nevieme – pri alergii na kuracie to nie je možné vylúčiť.', sensitivity='kuracie')
        if is_fishy:
            sc = {'tuk': 78, 'muck': 30, 'hydrolyz': 60, 'bielkov': 68}.get(f, 78)
            return dict(key=f'ryba-{f}', name=f'Ryba bez uvedenia druhu ({f})', category='tuk_olej' if f == 'tuk' else 'maso', classification='spracovana', score=sc, color=color(sc),
                        explanation='Ryba bez uvedenia druhu. Je to živočíšny zdroj (pri oleji aj omega-3 mastných kyselín), ale nevieme, aké ryby to sú.', sensitivity=None)
        return dict(key='maso-nespecifikovane', name='Mäso bez uvedenia zvieraťa', category='zivocisny_vedlajsi_produkt', classification='nespecifikovana', score=20, color=color(20),
                    explanation='Mäso bez uvedenia, z akého zvieraťa pochádza. Pri alergii sa nedá overiť a nie je jasná ani kvalita surovín.', sensitivity=None)
    # 3) ostatné zložky zo slovníka
    for rx, key, name, cat, cls, sc, expl, sens in EXTRA[:4] + D[12:] + EXTRA[4:]:
        if re.search(rx, t):
            return dict(key=key, name=name, category=cat, classification=cls, score=sc, color=color(sc), explanation=expl, sensitivity=sens)
    return dict(key=None, name=None, category=None, classification=None, score=None, color='seda',
                explanation='Túto zložku zatiaľ nemáme v databáze. Nehodnotíme ju a doplníme ju.', sensitivity=None)
