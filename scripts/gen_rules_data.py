"""Vygeneruje lib/scoring/rules-data.ts z reference/ingredients_rules.py (aby boli pravidlá 1:1)."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'reference'))
import ingredients_rules as r

def rule(t):
    rx, key, name, cat, cls, sc, expl, sens = t
    return dict(rx=rx, key=key, name=name, category=cat, classification=cls, score=sc, explanation=expl, sensitivity=sens)

data = dict(
    D=[rule(t) for t in r.D], EXTRA=[rule(t) for t in r.EXTRA],
    ANIMALS=[dict(rx=a[0], name=a[1], allergen=a[2]) for a in r.ANIMALS],
    FISH_GENERIC=r.FISH_GENERIC, POULTRY_GENERIC=r.POULTRY_GENERIC, MEAT_GENERIC=r.MEAT_GENERIC,
    JUNK=r.JUNK.pattern, MUSSEL=r.MUSSEL, MEAT_SCORES=r.MEAT_SCORES, FAT_FISH=r.FAT_FISH,
)
out = os.path.join(ROOT, 'lib', 'scoring', 'rules-data.ts')
with open(out, 'w', encoding='utf-8') as f:
    f.write('// VYGENEROVANÉ zo reference/ingredients_rules.py skriptom scripts/gen_rules_data.py – needitovať ručne.\n')
    f.write('export interface RawRule { rx: string; key: string; name: string; category: string; classification: string; score: number; explanation: string; sensitivity: string | null }\n')
    f.write('export interface RulesData { D: RawRule[]; EXTRA: RawRule[]; ANIMALS: { rx: string; name: string; allergen: string | null }[]; FISH_GENERIC: string; POULTRY_GENERIC: string; MEAT_GENERIC: string; JUNK: string; MUSSEL: string; MEAT_SCORES: Record<string, number>; FAT_FISH: Record<string, number> }\n')
    f.write('export const RULES: RulesData = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
print('ok', out)
