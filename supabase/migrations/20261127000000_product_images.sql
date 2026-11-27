-- Obrázok balenia pri produkte (URL na pôvodný zdroj – e-shop alebo výrobca; súbor sa k nám neukladá).
alter table public.products
  add column if not exists image_url text check (image_url ~ '^https://');
comment on column public.products.image_url is 'URL obrázka balenia u pôvodného zdroja (e-shop/výrobca). Zobrazuje sa priamo odtiaľ.';
