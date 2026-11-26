-- =====================================================================
-- Hodnotenie zložiek 0–100 a farba (metodika v1.0)
-- zelená 90–100 · žltá 70–89 · oranžová 50–69 · červená 0–49
-- Spustiť po 20261126000000_label_fields.sql.
-- =====================================================================

alter table public.ingredients
  add column if not exists score smallint check (score between 0 and 100),
  add column if not exists color text generated always as (
    case when score is null then null
         when score >= 90 then 'zelena'
         when score >= 70 then 'zlta'
         when score >= 50 then 'oranzova'
         else 'cervena' end) stored,
  add column if not exists occurrences integer not null default 0; -- v koľkých etiketách sa zložka vyskytuje

comment on column public.ingredients.score is 'Hodnotenie zložky 0–100 podľa metodiky (methodology_version).';

update public.methodology_versions
set changelog = 'Prvá verzia: hodnotenie zložiek 0–100 v štyroch farbách; skóre produktu = vážený priemer podľa poradia na etikete (1.–5. zložka 30/20/15/10/8 %, zvyšok 17 % rovnomerne); strop 49 pri červenej zložke medzi prvými piatimi, strop 69 pri umelom farbive, syntetickom konzervante alebo cukre; doplnkové látky (vitamíny, minerály) sa do skóre nepočítajú.',
    rules = '{
      "bands": {"zelena": [90,100], "zlta": [70,89], "oranzova": [50,69], "cervena": [0,49]},
      "position_weights": [30,20,15,10,8], "rest_weight": 17,
      "caps": [
        {"if": "cervena zlozka medzi prvymi 5", "max": 49},
        {"if": "farbiva | synteticke konzervanty | cukor kdekolvek", "max": 69}
      ],
      "verdicts": {"90": "Výborné zloženie", "70": "Kvalitné zloženie", "50": "Slabšia kvalita zloženia", "0": "Nekvalitné zloženie"},
      "additives_scored": false,
      "unknown_ingredients": "nehodnotia sa, zobrazia sa šedou a idú do fronty"
    }'::jsonb
where version = '1.0';
