-- Prepojenie s konfigurátorom na granula.sk (docs/ANALYZER_V2.md, bod 10):
-- id dotazníka uloženého cez POST https://www.granula.sk/api/quiz, odkaz granule-na-mieru.html?kviz=<id>.
alter table public.analyses
  add column if not exists granula_quiz_id uuid;
comment on column public.analyses.granula_quiz_id is 'Id odpovedí o psovi odovzdaných konfigurátoru na granula.sk (quiz_sessions).';
