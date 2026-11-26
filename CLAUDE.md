# Pravidlá pre prácu v repozitári

## Vetvy
- Jediná vetva je `main`. Žiadne feature vetvy, žiadne pull requesty.
- Každú zmenu hneď commitni a pushni priamo do `main` (`git push origin main`), bez pýtania.

## Prostredia
- Jediné prostredie je **production** (Supabase projekt `mqgukyfttafavlnlaoyj`).
- Push do `main` automaticky nasadí migrácie cez `.github/workflows/deploy-supabase.yml`.
- Web beží na Netlify (projekt `analyzer-granul-test`); nasadenie: `scripts/deploy-netlify.sh`.

## Databáza (Supabase)
- Zmeny schémy = **nový** súbor `supabase/migrations/<YYYYMMDDHHMMSS>_<popis>.sql`.
  Už nasadené migrácie nikdy needituj (v produkcii sa znova nespustia).
- `supabase/seed.sql` sú len ukážkové dáta – do produkcie sa automaticky nepúšťajú.
- Každá nová tabuľka musí mať zapnuté RLS a explicitné `grant`/policy.
