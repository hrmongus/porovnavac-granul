// VYGENEROVANÉ zo reference/ingredients_rules.py skriptom scripts/gen_rules_data.py – needitovať ručne.
export interface RawRule { rx: string; key: string; name: string; category: string; classification: string; score: number; explanation: string; sensitivity: string | null }
export interface RulesData { D: RawRule[]; EXTRA: RawRule[]; ANIMALS: { rx: string; name: string; allergen: string | null }[]; FISH_GENERIC: string; POULTRY_GENERIC: string; MEAT_GENERIC: string; JUNK: string; MEAT_SCORES: Record<string, number>; FAT_FISH: Record<string, number> }
export const RULES: RulesData = {
 "D": [
  {
   "rx": "vedlajsie produkty|vedlajsich produkt|vedlejsi produkt|by-product|by product|derivat|odvodene|odvozene",
   "key": "zivocisne-vedlajsie-produkty",
   "name": "Živočíšne vedľajšie produkty / deriváty",
   "category": "zivocisny_vedlajsi_produkt",
   "classification": "nespecifikovana",
   "score": 15,
   "explanation": "Súhrnné označenie pre časti zvierat, ktoré nie sú svalovinou (môžu to byť vnútornosti, ale aj menej hodnotné časti). Etiketa neuvádza, z akého zvieraťa ani z akých častí – nedá sa overiť, čo pes naozaj je.",
   "sensitivity": null
  },
  {
   "rx": "^masa?( a| &)? ?zivocis|^maso a|^masove? mucky|^mas[ao]vá? mucka|^masova mucka|^zivocisne bielkoviny$|^zivocisna bielkovina|^zivocisne proteiny|^zivocisne mucky|^mucka zo zivocis",
   "key": "maso-nespecifikovane",
   "name": "Mäso / mäsová múčka bez uvedenia zvieraťa",
   "category": "zivocisny_vedlajsi_produkt",
   "classification": "nespecifikovana",
   "score": 20,
   "explanation": "Mäso alebo múčka bez uvedenia, z akého zvieraťa pochádza. Pri alergii sa nedá overiť a nie je jasná ani kvalita surovín.",
   "sensitivity": null
  },
  {
   "rx": "^hydrolyzovany protein|^zdroje bielkovin|^lahko stravitelne bielkoviny|hydrolyz.*zivocis|zivocis.*hydrolyz|^hydrolyzovane bielkoviny$|^bielkovinovy hydrolyzat|^proteinovy hydrolyzat|^hydrolyzat bielkovin",
   "key": "hydrolyzat-nespecifikovany",
   "name": "Hydrolyzované bielkoviny (bez uvedenia zdroja)",
   "category": "zivocisny_vedlajsi_produkt",
   "classification": "nespecifikovana",
   "score": 40,
   "explanation": "Bielkoviny rozložené na menšie časti – zlepšujú chuť a sú ľahšie stráviteľné. Nie je však uvedené, z čoho pochádzajú, takže sa nedá overiť pôvod ani vhodnosť pri alergii.",
   "sensitivity": null
  },
  {
   "rx": "^zivocisn[ey] tuky?$|^zivocisne tuky|^tuky? zivocis|^zivocisny tuk",
   "key": "zivocisny-tuk-nespecifikovany",
   "name": "Živočíšny tuk (bez uvedenia zvieraťa)",
   "category": "tuk_olej",
   "classification": "nespecifikovana",
   "score": 30,
   "explanation": "Tuk zo zvierat bez uvedenia druhu. Dodáva energiu a chuť, ale nevieme, odkiaľ pochádza.",
   "sensitivity": null
  },
  {
   "rx": "^oleje a tuky|^tuky a oleje|^oleje$|^tuky$",
   "key": "oleje-a-tuky",
   "name": "Oleje a tuky (bez uvedenia zdroja)",
   "category": "tuk_olej",
   "classification": "nespecifikovana",
   "score": 20,
   "explanation": "Zmes tukov a olejov bez uvedenia, či sú živočíšne alebo rastlinné a z čoho. Výrobca tak môže meniť suroviny bez zmeny etikety.",
   "sensitivity": null
  },
  {
   "rx": "^ryby a vedlajsie|^ryby a produkty|^ryby a derivat|^rybie vedlajsie",
   "key": "ryby-vedlajsie-produkty",
   "name": "Ryby a vedľajšie produkty z rýb",
   "category": "zivocisny_vedlajsi_produkt",
   "classification": "nespecifikovana",
   "score": 25,
   "explanation": "Ryby a ich zvyšky bez uvedenia druhu. Nevieme, aké ryby ani aké časti obsahuje.",
   "sensitivity": null
  },
  {
   "rx": "pekarensk|pecivo|chlieb",
   "key": "pekarenske-vyrobky",
   "name": "Pekárenské výrobky",
   "category": "ine",
   "classification": "nespecifikovana",
   "score": 15,
   "explanation": "Zvyšky pečiva a pekárenských výrobkov. Lacný zdroj škrobu bez výživovej pridanej hodnoty pre psa.",
   "sensitivity": null
  },
  {
   "rx": "vedlajsie rastlin|vedlajs.*rastlin|produkty zo spracovania rastlin|specificke zlozky|rastlinne vedlajs|rastlinneho povodu|zeleninove vedlajs|^derivaty rastl|^vedlajsie produkty rastl",
   "key": "rastlinne-vedlajsie-produkty",
   "name": "Vedľajšie produkty rastlinného pôvodu",
   "category": "ine",
   "classification": "nespecifikovana",
   "score": 15,
   "explanation": "Zvyšky zo spracovania rastlín bez bližšieho určenia. Nevieme, čo presne obsahuje.",
   "sensitivity": null
  },
  {
   "rx": "farbiv|farbiaci|barvivo|colorant|e1[0-9]{2}\\b|tartrazin|oxid titanic",
   "key": "farbiva",
   "name": "Farbivá",
   "category": "prisada",
   "classification": "spracovana",
   "score": 5,
   "explanation": "Farbivo pridané kvôli vzhľadu granúl. Pre psa nemá žiadnu funkciu – je tam pre oko človeka.",
   "sensitivity": null
  },
  {
   "rx": "^konzervant|^konzervacne latky|\\bbha\\b|\\bbht\\b|etoxych|ethoxyqu|propylgal|propylenglyk|propylene glyc|\\be32[01]\\b|\\be324\\b|sorban draseln|benzoan",
   "key": "syntet-konzervanty",
   "name": "Syntetické konzervanty / antioxidanty",
   "category": "prisada",
   "classification": "spracovana",
   "score": 5,
   "explanation": "Syntetická konzervačná látka. V kvalitných krmivách sa namiesto nej používajú prírodné antioxidanty (napr. tokoferoly, rozmarín).",
   "sensitivity": null
  },
  {
   "rx": "cukor|cukry|sacharoz|glukozov[yý] sirup|karamel|melasa|melas|med\\b|dextroz|fruktoz(?!o)",
   "key": "cukor",
   "name": "Cukor / sladidlá",
   "category": "prisada",
   "classification": "spracovana",
   "score": 10,
   "explanation": "Pridaný cukor alebo sladidlo – zlepšuje chuť, ale pes ho vo výžive nepotrebuje a prispieva k nadváhe a zubnému kameňu.",
   "sensitivity": null
  },
  {
   "rx": "^ochucov|^arom|^aromat|^chutov|^flavou?r|zvyraznovac chut|glutaman",
   "key": "aromy",
   "name": "Arómy (bez uvedenia zdroja)",
   "category": "prisada",
   "classification": "nespecifikovana",
   "score": 30,
   "explanation": "Látky na zlepšenie chuti a vône. Ak nie je uvedené, z čoho sú, nevieme posúdiť ich pôvod.",
   "sensitivity": null
  },
  {
   "rx": "prirodn[ae] arom|prirodne aromat|natural flavou?r|^digest|pecenovy digest",
   "key": "prirodne-aromy",
   "name": "Prírodné arómy / digest",
   "category": "prisada",
   "classification": "spracovana",
   "score": 60,
   "explanation": "Prírodné chuťové látky (často z hydrolyzovaných živočíšnych tkanív). Zlepšujú chuť, ale často sa neuvádza zdroj.",
   "sensitivity": null
  },
  {
   "rx": "kukuric.*(lepok|glut|bielkovin|protein)|corn gluten|maize gluten",
   "key": "kukuricny-lepok",
   "name": "Kukuričný lepok / kukuričná bielkovina",
   "category": "obilnina",
   "classification": "spracovana",
   "score": 35,
   "explanation": "Bielkovinová frakcia z kukurice, zvyšok po výrobe škrobu. Lacne zvyšuje číslo „bielkoviny“ na etikete, ale rastlinná bielkovina je pre psa menej hodnotná ako živočíšna.",
   "sensitivity": "obilniny"
  },
  {
   "rx": "psenic.*(lepok|glut|bielkovin|protein)|wheat gluten",
   "key": "psenicny-lepok",
   "name": "Pšeničný lepok",
   "category": "obilnina",
   "classification": "spracovana",
   "score": 35,
   "explanation": "Bielkovina z pšenice. Lacne zvyšuje obsah bielkovín na etikete; pre psy citlivé na lepok nevhodná.",
   "sensitivity": "obilniny"
  },
  {
   "rx": "^obilnin|^obilie|^cereal|^zmes obilnin",
   "key": "obilniny-nespecifikovane",
   "name": "Obilniny (bez uvedenia druhu)",
   "category": "obilnina",
   "classification": "nespecifikovana",
   "score": 30,
   "explanation": "Obilniny bez uvedenia, o ktoré ide. Výrobca môže ich zloženie meniť podľa ceny suroviny.",
   "sensitivity": "obilniny"
  },
  {
   "rx": "kukur|corn|maize",
   "key": "kukurica",
   "name": "Kukurica",
   "category": "obilnina",
   "classification": "pomenovana",
   "score": 55,
   "explanation": "Obilnina, lacný zdroj energie (škrobu) a pojivo granúl. Nutrične slabšia ako mäso; ak je vysoko v zložení, granula je postavená skôr na obilí ako na mäse.",
   "sensitivity": "obilniny"
  },
  {
   "rx": "psenic|wheat|psenice",
   "key": "psenica",
   "name": "Pšenica",
   "category": "obilnina",
   "classification": "pomenovana",
   "score": 50,
   "explanation": "Obilnina, lacný zdroj energie a pojivo. Obsahuje lepok – niektoré psy na ňu reagujú citlivo (trávenie, koža).",
   "sensitivity": "obilniny"
  },
  {
   "rx": "soj|soya|soy\\b|soybean",
   "key": "soja",
   "name": "Sója / sójová múka",
   "category": "strukovina",
   "classification": "pomenovana",
   "score": 40,
   "explanation": "Lacný rastlinný zdroj bielkovín. Zvyšuje číslo bielkovín na etikete, je častým alergénom a môže spôsobovať plynatosť.",
   "sensitivity": "strukoviny"
  },
  {
   "rx": "(ryz|ovsen|psenic|kukuric).*otrub",
   "key": "otruby",
   "name": "Otruby",
   "category": "vlaknina",
   "classification": "pomenovana",
   "score": 65,
   "explanation": "Obalové časti zŕn – zdroj vlákniny. Výživovo málo hodnotné.",
   "sensitivity": "obilniny"
  },
  {
   "rx": "hneda ryz|celozrnn[aá] ryz|natural rice|brown rice|ryza natural",
   "key": "hneda-ryza",
   "name": "Hnedá / celozrnná ryža",
   "category": "obilnina",
   "classification": "pomenovana",
   "score": 85,
   "explanation": "Celozrnná ryža – zdroj energie a vlákniny, dobre stráviteľná.",
   "sensitivity": "obilniny"
  },
  {
   "rx": "ryz|rice|rys\\b|ryze",
   "key": "ryza",
   "name": "Ryža",
   "category": "obilnina",
   "classification": "pomenovana",
   "score": 80,
   "explanation": "Ľahko stráviteľný zdroj energie (sacharidov), vhodný aj pre citlivé trávenie.",
   "sensitivity": "obilniny"
  },
  {
   "rx": "ovos|oves|ovsen|oat",
   "key": "ovos",
   "name": "Ovos / ovsené vločky",
   "category": "obilnina",
   "classification": "pomenovana",
   "score": 78,
   "explanation": "Obilnina s vlákninou a beta-glukánmi, šetrná k tráveniu.",
   "sensitivity": "obilniny"
  },
  {
   "rx": "jacm|jecm|barley",
   "key": "jacmen",
   "name": "Jačmeň",
   "category": "obilnina",
   "classification": "pomenovana",
   "score": 72,
   "explanation": "Obilnina, zdroj energie a vlákniny. Obsahuje lepok.",
   "sensitivity": "obilniny"
  },
  {
   "rx": "quino|spald|spelt|proso|millet|jahl|cirok|sorghum|pohan|buckwheat|quinoa|kinoa|amarant|tritikal|raz\\b|rasz|zito|rye",
   "key": "ine-obilniny",
   "name": "Proso / cirok / špalda / pohánka / quinoa",
   "category": "obilnina",
   "classification": "pomenovana",
   "score": 75,
   "explanation": "Menej bežná obilnina alebo pseudoobilnina – zdroj energie a vlákniny.",
   "sensitivity": "obilniny"
  },
  {
   "rx": "hrach.*(protein|bielkov|skrob|vlakn|muck|fiber|starch)|hras.*(protein|bielkov|skrob|vlakn|muck)|pea (protein|starch|fib)",
   "key": "hrachove-frakcie",
   "name": "Hrachová bielkovina / škrob / vláknina",
   "category": "strukovina",
   "classification": "spracovana",
   "score": 55,
   "explanation": "Časť hrachu oddelená pri spracovaní. Hrachová bielkovina lacne zvyšuje obsah bielkovín na etikete, škrob slúži ako pojivo. Ak je ich v zložení viac, môžu „rozdeliť“ hrach, aby nebol na prvom mieste.",
   "sensitivity": "strukoviny"
  },
  {
   "rx": "hrach|hras|pea\\b|peas\\b",
   "key": "hrach",
   "name": "Hrach / hrášok",
   "category": "strukovina",
   "classification": "pomenovana",
   "score": 70,
   "explanation": "Strukovina – zdroj energie, vlákniny a rastlinnej bielkoviny. Bežná náhrada obilia v krmivách „bez obilnín“.",
   "sensitivity": "strukoviny"
  },
  {
   "rx": "sosovic|cocka|lentil|cicer|cizrn|chickpea|fazul|fazol|bean|bob\\b|lupin|vlcí bob",
   "key": "ine-strukoviny",
   "name": "Šošovica / cícer / fazuľa",
   "category": "strukovina",
   "classification": "pomenovana",
   "score": 72,
   "explanation": "Strukovina – zdroj energie, vlákniny a rastlinnej bielkoviny.",
   "sensitivity": "strukoviny"
  },
  {
   "rx": "sladk[eé] zemiak|batat|sweet potato|kukurydz",
   "key": "batat",
   "name": "Batáty (sladké zemiaky)",
   "category": "zelenina_ovocie",
   "classification": "pomenovana",
   "score": 85,
   "explanation": "Zdroj energie a vlákniny s pomalším uvoľňovaním cukrov, dobre stráviteľný.",
   "sensitivity": null
  },
  {
   "rx": "skrob|starch|tapiok|tapioc|maniok|cassava",
   "key": "skrob",
   "name": "Škrob (zemiakový, tapiokový…)",
   "category": "ine",
   "classification": "spracovana",
   "score": 55,
   "explanation": "Čistý škrob – pojivo, ktoré drží granulu pokope, a lacný zdroj energie. Výživovo chudobný.",
   "sensitivity": null
  },
  {
   "rx": "zemiak|brambor|potato",
   "key": "zemiaky",
   "name": "Zemiaky / zemiakové vločky",
   "category": "zelenina_ovocie",
   "classification": "pomenovana",
   "score": 70,
   "explanation": "Zdroj energie (škrobu), bežná náhrada obilia v krmivách bez obilnín.",
   "sensitivity": null
  },
  {
   "rx": "lignocel|celuloz|cellulos|drevit",
   "key": "celuloza",
   "name": "Celulóza / lignocelulóza",
   "category": "vlaknina",
   "classification": "spracovana",
   "score": 50,
   "explanation": "Nerozpustná vláknina (často z dreva). Pomáha pri sýtosti a tvorbe stolice, ale nemá výživovú hodnotu – vo väčšom množstve je to plnivo.",
   "sensitivity": null
  },
  {
   "rx": "^(?!.*cerven).*(repn|repne|repy\\b|repa\\b|cukrov[a]? rep|beet)",
   "key": "repna-duzina",
   "name": "Repná dužina / repné rezky",
   "category": "vlaknina",
   "classification": "spracovana",
   "score": 75,
   "explanation": "Vláknina z cukrovej repy (cukor je odstránený). Podporuje trávenie a pevnú stolicu.",
   "sensitivity": null
  },
  {
   "rx": "psyllium|plantago|skorocel",
   "key": "psyllium",
   "name": "Psyllium (skorocel)",
   "category": "vlaknina",
   "classification": "pomenovana",
   "score": 85,
   "explanation": "Rozpustná vláknina, ktorá reguluje trávenie a stolicu.",
   "sensitivity": null
  },
  {
   "rx": "otrub|bran\\b",
   "key": "otruby",
   "name": "Otruby",
   "category": "vlaknina",
   "classification": "pomenovana",
   "score": 65,
   "explanation": "Obalové časti zŕn – zdroj vlákniny. Výživovo málo hodnotné.",
   "sensitivity": "obilniny"
  },
  {
   "rx": "cakank|cekank|inulin|chicor|frukto.?oligo|fos\\b|manan|mannan|mos\\b|glukan|oligosachar|prebiot|bunkove steny kvas",
   "key": "prebiotika",
   "name": "Prebiotiká (čakanka, inulín, FOS, MOS)",
   "category": "vlaknina",
   "classification": "pomenovana",
   "score": 92,
   "explanation": "Látky, ktoré slúžia ako potrava pre prospešné črevné baktérie a podporujú zdravé trávenie a imunitu.",
   "sensitivity": null
  },
  {
   "rx": "skorapk|skořápk|koryš|korys|glukozam|glukosam|glucosam|chondroit|kolagen|collagen|zelenoust|zelenoš|green.?lipped|msm\\b|metylsulfonyl|chrupav|cartilag",
   "key": "klby",
   "name": "Glukozamín / chondroitín / kolagén",
   "category": "prisada",
   "classification": "pomenovana",
   "score": 92,
   "explanation": "Látky prirodzene sa vyskytujúce v chrupavkách. Pridávajú sa na podporu kĺbov.",
   "sensitivity": null
  },
  {
   "rx": "pivovar|brewer|kvasn|drozdi|kvasinky|yeast|saccharomyc",
   "key": "kvasnice",
   "name": "Kvasnice / pivovarské kvasnice",
   "category": "prisada",
   "classification": "pomenovana",
   "score": 85,
   "explanation": "Zdroj vitamínov skupiny B, bielkovín a látok podporujúcich imunitu. Zlepšujú aj chuť.",
   "sensitivity": null
  },
  {
   "rx": "deaktivovane bakter|probiot|enterococc|lactobac|bacillus|bifido|postbiot",
   "key": "probiotika",
   "name": "Probiotiká / postbiotiká",
   "category": "prisada",
   "classification": "pomenovana",
   "score": 92,
   "explanation": "Prospešné baktérie (alebo ich produkty) na podporu črevnej mikroflóry.",
   "sensitivity": null
  },
  {
   "rx": "yuc+a|juk[aoy]|juky",
   "key": "yucca",
   "name": "Yucca schidigera",
   "category": "prisada",
   "classification": "pomenovana",
   "score": 88,
   "explanation": "Výťažok z rastliny yucca – znižuje zápach stolice a podporuje trávenie.",
   "sensitivity": null
  },
  {
   "rx": "rias|ras[ay]\\b|riasy|riasa|kelp|chaluh|spirulin|chlorel|alga|schizochytr|morsk[aá] trav|seaweed",
   "key": "riasy",
   "name": "Morské riasy / spirulina",
   "category": "prisada",
   "classification": "pomenovana",
   "score": 88,
   "explanation": "Prírodný zdroj minerálov, jódu a pri niektorých riasach aj omega-3 mastných kyselín.",
   "sensitivity": null
  },
  {
   "rx": "vajc|vajec|vejc|egg",
   "key": "vajcia",
   "name": "Vajcia",
   "category": "maso",
   "classification": "pomenovana",
   "score": 92,
   "explanation": "Vysoko stráviteľná živočíšna bielkovina s výbornou biologickou hodnotou.",
   "sensitivity": null
  },
  {
   "rx": "mliek|mlec|syr\\b|syrov|srvatk|whey|milk|cheese|jogurt|tvaroh",
   "key": "mliecne",
   "name": "Mlieko a mliečne výrobky",
   "category": "ine",
   "classification": "pomenovana",
   "score": 55,
   "explanation": "Mliečne zložky zlepšujú chuť. Dospelé psy však laktózu často zle trávia.",
   "sensitivity": null
  },
  {
   "rx": "mineral|nerast",
   "key": "mineralne-latky",
   "name": "Minerálne látky",
   "category": "vitaminy_mineraly",
   "classification": "nespecifikovana",
   "score": 75,
   "explanation": "Zmes minerálov (vápnik, fosfor, sodík…) potrebná pre kompletnú výživu. Bežné, ale bez bližšieho rozpisu.",
   "sensitivity": null
  },
  {
   "rx": "chlorid sodn|kuchynsk[aá] sol|\\bsol\\b|soľ|sodium chlor",
   "key": "sol",
   "name": "Soľ (chlorid sodný)",
   "category": "vitaminy_mineraly",
   "classification": "pomenovana",
   "score": 70,
   "explanation": "Zdroj sodíka. V malom množstve potrebná, vo väčšom zlepšuje chuť a zvyšuje pitie.",
   "sensitivity": null
  },
  {
   "rx": "chlorid drasel|uhlicitan vapen|fosforecnan|fosfat|vapnik|kalcium|calcium|draslik|horcik|magnez|oxid horecn|vajecne skrup|vajecn[aá] skrup|egg ?shell|kostn[aá] mucka",
   "key": "mineraly-konkretne",
   "name": "Konkrétne minerály (vápnik, draslík, fosfor…)",
   "category": "vitaminy_mineraly",
   "classification": "pomenovana",
   "score": 85,
   "explanation": "Konkrétne uvedený minerál potrebný na vyváženie výživy.",
   "sensitivity": null
  },
  {
   "rx": "vit\\. ?[a-z]|nukleotid|vitamin|taurin|karnitin|carnitin|cholin|biotin|niacin|kyselina listov|pantoten|lysin|metionin|tryptofan|aminokysel",
   "key": "vitaminy",
   "name": "Vitamíny / aminokyseliny",
   "category": "vitaminy_mineraly",
   "classification": "pomenovana",
   "score": 90,
   "explanation": "Doplnené vitamíny alebo aminokyseliny, ktoré zabezpečujú kompletnú výživu.",
   "sensitivity": null
  },
  {
   "rx": "^antioxidanty?$|^antioxidacne latky$|^konzervacne latky a antioxid",
   "key": "antioxidanty-nespec",
   "name": "Antioxidanty (bez uvedenia druhu)",
   "category": "prisada",
   "classification": "nespecifikovana",
   "score": 50,
   "explanation": "Látky chrániace tuky pred žltnutím. Nie je uvedené, či ide o prírodné (tokoferoly, rozmarín) alebo syntetické.",
   "sensitivity": null
  },
  {
   "rx": "tokoferol|rozmarin.*extrakt|extrakt z rozmar|vytazok z rozmar|rosemary|antioxid|kyselina citron|askorb",
   "key": "prirodne-antioxidanty",
   "name": "Prírodné antioxidanty (tokoferoly, rozmarín)",
   "category": "prisada",
   "classification": "pomenovana",
   "score": 90,
   "explanation": "Prírodné látky, ktoré chránia tuky v granulách pred žltnutím. Lepšia alternatíva syntetických konzervantov.",
   "sensitivity": null
  },
  {
   "rx": "lanov|lnen|lnene|linseed|flax",
   "key": "lan",
   "name": "Ľanové semienko / ľanový olej",
   "category": "tuk_olej",
   "classification": "pomenovana",
   "score": 90,
   "explanation": "Zdroj omega-3 mastných kyselín (ALA) a vlákniny – podporuje kožu a srsť.",
   "sensitivity": null
  },
  {
   "rx": "palmov|palm\\b|palm oil",
   "key": "palmovy-olej",
   "name": "Palmový olej",
   "category": "tuk_olej",
   "classification": "pomenovana",
   "score": 45,
   "explanation": "Lacný rastlinný tuk s nízkym obsahom esenciálnych mastných kyselín. Pre psa výživovo málo prínosný.",
   "sensitivity": null
  },
  {
   "rx": "sojov[yý] olej|soy(bean)? oil",
   "key": "sojovy-olej",
   "name": "Sójový olej",
   "category": "tuk_olej",
   "classification": "pomenovana",
   "score": 60,
   "explanation": "Rastlinný olej, zdroj omega-6 mastných kyselín. Lacnejšia alternatíva k rybím olejom.",
   "sensitivity": null
  },
  {
   "rx": "slnecnic|slunecnic|sunflower|repkov|repkovy|rapeseed|canola|kukuricn[yý] olej|svetlicov|safflower|konopn|hemp|kokos|coconut|olivov|olive|pupalk|borak|ostropest[rř]|chia|tekvicov[eé] semi|semienk",
   "key": "rastlinne-oleje-semena",
   "name": "Rastlinné oleje a semená (slnečnica, repka, konope…)",
   "category": "tuk_olej",
   "classification": "pomenovana",
   "score": 75,
   "explanation": "Konkrétne pomenovaný rastlinný olej alebo semeno – zdroj energie a mastných kyselín.",
   "sensitivity": null
  },
  {
   "rx": "rastlinn[yý] olej|rastlinne oleje|rastlinny tuk|rastlinne tuky|vegetable oil",
   "key": "rastlinny-olej-nespec",
   "name": "Rastlinný olej (bez uvedenia zdroja)",
   "category": "tuk_olej",
   "classification": "nespecifikovana",
   "score": 40,
   "explanation": "Rastlinný olej bez uvedenia, z akej rastliny je. Nevieme posúdiť jeho kvalitu ani pomer mastných kyselín.",
   "sensitivity": null
  },
  {
   "rx": "cerven[a]? rep|mrkv|tekvic|dyne|dýn|pumpkin|carrot|spenat|spinach|brokol|kapust|kel\\b|cuket|zucchin|petrzl|parsley|zeler|celer|cvikl|repa cerven|paradajk|rajc|tomat|hrasok zelen|zelenin|vegetab|pastrnak|pastinak|cibul|fenikel|fenykl|artici|spargl|pazitk|redkev|salat|pazit|batat",
   "key": "zelenina",
   "name": "Zelenina",
   "category": "zelenina_ovocie",
   "classification": "pomenovana",
   "score": 90,
   "explanation": "Zelenina dodáva vlákninu, vitamíny a antioxidanty. Zvyčajne je jej v granulách malé množstvo.",
   "sensitivity": null
  },
  {
   "rx": "svestk|merun|jablk|jablc|jablec|apple|hrus|pear|brusnic|cranberr|cucoried|boruvk|blueberr|malin|raspberr|jahod|strawb|rakytn|sea ?buckthorn|sipk|rose ?hip|baz|elderb|aron|ostruzin|cerni|banan|ovoc|fruit|citrus|pomaran|grep|granat|goji|acerol|ribezl|ribez|visn|ceresn|slivk|marhul|mango|papay|ananas|datl",
   "key": "ovocie",
   "name": "Ovocie a bobuľoviny",
   "category": "zelenina_ovocie",
   "classification": "pomenovana",
   "score": 90,
   "explanation": "Ovocie a bobuľoviny sú zdrojom vitamínov a antioxidantov. V granulách býva v malom množstve.",
   "sensitivity": null
  },
  {
   "rx": "rozmaryn|korian|grifola|tanin|rozmarin|tymian|kurkum|turmeric|zazvor|ginger|petrzlen|bazalk|oregan|harmanc|camomil|chamomil|medovk|mata|mint|zihlav|nettle|pestrec|silymar|milk thistle|lopuch|burdock|pupava|dandelion|levand|lavend|ibis|marshmallow|alfalfa|lucern|bylin|herb|koren|root|klincek|clove|skorica|cinnamon|cesnak|garlic|kmin|anyz|horc|imel|rebrick|cernic|zemezl|echinac|ginkgo|ginseng|sedmokr|nechtik|marigold|ostruzin|zihlav|reishi|shiitake|hliv|huby|mushroom",
   "key": "bylinky",
   "name": "Bylinky a koreniny",
   "category": "prisada",
   "classification": "pomenovana",
   "score": 88,
   "explanation": "Bylinky a koreniny pridané v malom množstve pre chuť alebo podporu trávenia. Na celkovú výživu majú malý vplyv.",
   "sensitivity": null
  }
 ],
 "EXTRA": [
  {
   "rx": "hydrolyz.*pecen|^pecen|^pecene|hydrolyzovane pecene",
   "key": "pecen-nespecifikovana",
   "name": "Pečeň (bez uvedenia zvieraťa)",
   "category": "zivocisny_vedlajsi_produkt",
   "classification": "spracovana",
   "score": 65,
   "explanation": "Pečeň bez uvedenia zvieraťa – výživovo hodnotná a chutná, ale nevieme, z akého zvieraťa pochádza.",
   "sensitivity": null
  },
  {
   "rx": "rastlinn[eaá] bielkovin|bielkovinov[yý] (izolat|extrakt)|rastlinny protein|rastlinne proteiny",
   "key": "rastlinna-bielkovina-nespec",
   "name": "Rastlinná bielkovina (bez uvedenia zdroja)",
   "category": "ine",
   "classification": "nespecifikovana",
   "score": 45,
   "explanation": "Bielkovina z rastlín bez uvedenia, z akých. Lacne zvyšuje obsah bielkovín na etikete; pre psa je menej hodnotná ako živočíšna.",
   "sensitivity": null
  },
  {
   "rx": "autolyzat",
   "key": "autolyzat",
   "name": "Autolyzát (bez uvedenia zdroja)",
   "category": "prisada",
   "classification": "nespecifikovana",
   "score": 45,
   "explanation": "Produkt samovoľného rozkladu bielkovín (napr. kvasníc alebo mäsa), slúži na zlepšenie chuti. Zdroj nie je uvedený.",
   "sensitivity": null
  },
  {
   "rx": "kostn[yý] tuk|skvark|lojov|sadlo",
   "key": "tuk-zvysky",
   "name": "Kostný tuk / škvarky (bez uvedenia zvieraťa)",
   "category": "tuk_olej",
   "classification": "nespecifikovana",
   "score": 35,
   "explanation": "Tuk získaný zo zvyškov (kosti, škvarky) bez uvedenia zvieraťa. Zdroj energie a chuti, ale nízkej a neoveriteľnej kvality.",
   "sensitivity": null
  },
  {
   "rx": "glycerin|glycerol|sorbitol|zelatin|gelatin",
   "key": "glycerin",
   "name": "Glycerín / sorbitol",
   "category": "prisada",
   "classification": "spracovana",
   "score": 55,
   "explanation": "Látka udržiavajúca vlhkosť a mäkkosť granúl. Pre výživu psa nemá význam.",
   "sensitivity": null
  },
  {
   "rx": "lecitin|lecithin",
   "key": "lecitin",
   "name": "Lecitín",
   "category": "prisada",
   "classification": "pomenovana",
   "score": 80,
   "explanation": "Prírodný emulgátor (zvyčajne zo sóje alebo slnečnice), zdroj fosfolipidov.",
   "sensitivity": null
  },
  {
   "rx": "klinoptilol|zeolit|bentonit|rasel|humin|montmorillon|kremelin|diatom",
   "key": "ilove-mineraly",
   "name": "Íly a ílové minerály (zeolit, rašelina, humínové látky)",
   "category": "vitaminy_mineraly",
   "classification": "pomenovana",
   "score": 70,
   "explanation": "Prírodné látky, ktoré viažu toxíny a pomáhajú pri trávení a pevnej stolici.",
   "sensitivity": null
  },
  {
   "rx": "^vlaknin|rastlinn[aá] vlaknin|^vlaknina|psylli|cukrovarsk[eé] rezk",
   "key": "vlaknina-rastlinna",
   "name": "Rastlinná vláknina",
   "category": "vlaknina",
   "classification": "nespecifikovana",
   "score": 70,
   "explanation": "Vláknina z rastlín bez bližšieho určenia – podporuje trávenie a pocit sýtosti.",
   "sensitivity": null
  },
  {
   "rx": "caj|green tea|aloe|aksamiet|anyz|aniz|salvi|salvej|sipok|kvaka|kvak|hrebicek|rasc|zeruch|karob|carob|svatojanskeho|citron|limet",
   "key": "bylinky2",
   "name": "Bylinky, čaj a rastlinné extrakty",
   "category": "prisada",
   "classification": "pomenovana",
   "score": 88,
   "explanation": "Bylinky a rastlinné extrakty pridané v malom množstve pre chuť alebo podporu trávenia a imunity.",
   "sensitivity": null
  },
  {
   "rx": "lesne plody|lesne bobul|brusink|bobul",
   "key": "ovocie2",
   "name": "Lesné plody a bobuľoviny",
   "category": "zelenina_ovocie",
   "classification": "pomenovana",
   "score": 90,
   "explanation": "Bobuľoviny sú zdrojom vitamínov a antioxidantov. V granulách býva v malom množstve.",
   "sensitivity": null
  },
  {
   "rx": "fosfor|zelezo|zinok|med\\b|mangan|jod|selen|uhlicitan|draslik|sodik|horcik|vapnik|sirany?|oxid",
   "key": "mineraly-konkretne",
   "name": "Konkrétne minerály (vápnik, draslík, fosfor…)",
   "category": "vitaminy_mineraly",
   "classification": "pomenovana",
   "score": 85,
   "explanation": "Konkrétne uvedený minerál potrebný na vyváženie výživy.",
   "sensitivity": null
  },
  {
   "rx": "chondroprotekt|omega|\\bdha\\b|\\bepa\\b",
   "key": "klby",
   "name": "Glukozamín / chondroitín / kolagén",
   "category": "prisada",
   "classification": "pomenovana",
   "score": 92,
   "explanation": "Látky na podporu kĺbov, srsti a kože pridávané do krmiva.",
   "sensitivity": null
  },
  {
   "rx": "kvasinkov|kvasnicov",
   "key": "kvasnice",
   "name": "Kvasnice / pivovarské kvasnice",
   "category": "prisada",
   "classification": "pomenovana",
   "score": 85,
   "explanation": "Zdroj vitamínov skupiny B, bielkovín a látok podporujúcich imunitu. Zlepšujú aj chuť.",
   "sensitivity": null
  }
 ],
 "ANIMALS": [
  {
   "rx": "kurac|kurat|kura\\b|kure|kurec|kurc|chicken",
   "name": "kuracie",
   "allergen": "kuracie"
  },
  {
   "rx": "morc|morka|morky|kruti|kruta|krocan|turkey",
   "name": "morčacie",
   "allergen": null
  },
  {
   "rx": "kac|kach|duck",
   "name": "kačacie",
   "allergen": null
  },
  {
   "rx": "husac|husi\\b|hus\\b|goose",
   "name": "husacie",
   "allergen": null
  },
  {
   "rx": "jahn|jehne|lamb|ovci|ovc",
   "name": "jahňacie",
   "allergen": null
  },
  {
   "rx": "hovad|hovez|beef|telac|telec|byvol|buvol|angus",
   "name": "hovädzie",
   "allergen": null
  },
  {
   "rx": "bravc|vepr|pork|diviak|divocak|kanec|iberic",
   "name": "bravčové",
   "allergen": null
  },
  {
   "rx": "kral|rabbit",
   "name": "králičie",
   "allergen": null
  },
  {
   "rx": "jelen|srn|dan[ie]e?l|zverin|venison|divina",
   "name": "zverina",
   "allergen": null
  },
  {
   "rx": "koz[ie]|kozi\\b|goat",
   "name": "kozie",
   "allergen": null
  },
  {
   "rx": "kon[ie]|konsk|horse",
   "name": "konské",
   "allergen": null
  },
  {
   "rx": "prepelic|krepelk|quail",
   "name": "prepeličie",
   "allergen": null
  },
  {
   "rx": "pstruh|trout",
   "name": "pstruh",
   "allergen": null
  },
  {
   "rx": "losos|salmon",
   "name": "losos",
   "allergen": null
  },
  {
   "rx": "sled|slaď|herring|heryn|harin",
   "name": "sleď",
   "allergen": null
  },
  {
   "rx": "tresk|cod\\b|treska",
   "name": "treska",
   "allergen": null
  },
  {
   "rx": "tuniak|tuna|tunak",
   "name": "tuniak",
   "allergen": null
  },
  {
   "rx": "sardin|sardel|ancov|anchov",
   "name": "sardinky",
   "allergen": null
  },
  {
   "rx": "makrel",
   "name": "makrela",
   "allergen": null
  },
  {
   "rx": "platesa|platyz|flounder|plaice",
   "name": "platesa",
   "allergen": null
  },
  {
   "rx": "kapor|kapr|carp",
   "name": "kapor",
   "allergen": null
  },
  {
   "rx": "krill|kril\\b|krevet|shrimp|musl|slavk|perna",
   "name": "morské plody",
   "allergen": null
  },
  {
   "rx": "hmyz|insect|cvrc|larv|hermetia|mucha",
   "name": "hmyz",
   "allergen": null
  },
  {
   "rx": "biela ryba|bila ryba|white fish|whitefish|morske ryby|morskych ryb",
   "name": "biela morská ryba",
   "allergen": null
  }
 ],
 "FISH_GENERIC": "\\bryb|\\bryby|fish",
 "POULTRY_GENERIC": "hydin|drub|poultry",
 "MEAT_GENERIC": "\\bmas[oa]\\b|\\bmaso\\b|meat|\\bmase\\b|masov",
 "JUNK": "^(\\d+([.,]\\d+)? ?kg\\b|\\)|zlozky$|prirodne prisady|zlozenie|slozeni|= ?prirodn|prirodne zlozky|vlhkost|popol|hrub[ya] (popol|vlaknina|tuk|protein)|dostupne balenia|kompletne krmivo|dopln?kove krmivo|susene$|cerstve$|pridavne|technologick|nutricne|analyticke|obsah|metabolizovatel|energia|semena$|semienka$)",
 "MEAT_SCORES": {
  "cerstve": 100,
  "susene": 100,
  "maso": 100,
  "vnutor": 97,
  "hydrolyz": 85,
  "bielkov": 90,
  "muck": 80,
  "tuk": 85,
  "vyvar": 75
 },
 "FAT_FISH": {
  "losos": 92,
  "sleď": 90,
  "treska": 88,
  "sardinky": 90,
  "makrela": 90,
  "pstruh": 90,
  "morské plody": 90
 }
};
