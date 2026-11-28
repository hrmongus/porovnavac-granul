// Načítanie verejných dát zo Supabase (zložky, aliasy, skóre trhu). Čítanie cez publishable key (RLS).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AliasMap, DbIngredient } from './scoring/analyze';

export function publicClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Chýba SUPABASE_URL alebo SUPABASE_PUBLISHABLE_KEY v .env');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Načíta všetky riadky (PostgREST vracia max. 1000 na požiadavku). */
export async function fetchAll<T>(sb: SupabaseClient, table: string, select: string): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await sb.from(table).select(select).order(select.split(',')[0].trim()).range(from, from + page - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data as T[]));
    if (!data || data.length < page) break;
  }
  return out;
}

export interface ReferenceData {
  aliases: AliasMap;
  ingredients: DbIngredient[];
  marketScores: number[]; // zoradené vzostupne, bez značiek
  marketMeatMedian: number | null; // medián odhadu % mäsa (len produkty s uvedenými percentami)
  catalog: CatalogItem[]; // na vyhľadávanie (značka + názov)
}

export interface CatalogItem { id: number; brand: string; name: string; search: string; image_url: string | null }

let cache: { at: number; data: ReferenceData } | null = null;
const TTL_MS = 10 * 60 * 1000;

export async function loadReferenceData(sb: SupabaseClient = publicClient()): Promise<ReferenceData> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const ingredients = await fetchAll<DbIngredient & { id: number }>(
    sb, 'ingredients', 'id, slug, name_sk, score, category, classification, sensitivity_flags, what_it_is');
  const byId = new Map(ingredients.map((i) => [i.id, i]));
  const aliasRows = await fetchAll<{ alias: string; ingredient_id: number }>(sb, 'ingredient_aliases', 'alias, ingredient_id');
  const aliases: AliasMap = new Map();
  for (const a of aliasRows) {
    const ing = byId.get(a.ingredient_id);
    if (ing) aliases.set(a.alias, ing);
  }
  const rows = await fetchAll<{ id: number; name: string; score_total: number | null; meat_percent_est: number | null; image_url: string | null; brands: { name: string } | null }>(
    sb, 'products', 'id, name, score_total, meat_percent_est, image_url, brands(name)');
  const marketScores = rows.map((s) => s.score_total).filter((s): s is number => s !== null).sort((a, b) => a - b);
  const meats = rows.map((s) => s.meat_percent_est).filter((s): s is number => s !== null).sort((a, b) => a - b);
  const marketMeatMedian = meats.length ? Math.round(meats.length % 2 ? meats[(meats.length - 1) / 2] : (meats[meats.length / 2 - 1] + meats[meats.length / 2]) / 2) : null;
  const catalog = rows.map((r) => {
    const brand = r.brands?.name ?? '';
    return { id: r.id, brand, name: r.name, search: normalizeSearch(`${brand} ${r.name}`), image_url: r.image_url };
  });
  const data = { aliases, ingredients, marketScores, marketMeatMedian, catalog };
  cache = { at: Date.now(), data };
  return data;
}

/** Podiel granúl trhu s nižším skóre (0–100 %). */
export function percentileBelow(score: number, marketScores: number[]): number {
  if (marketScores.length === 0) return 0;
  const lower = marketScores.filter((s) => s < score).length;
  return Math.round((lower / marketScores.length) * 100);
}

/** Text na vyhľadávanie: malé písmená, bez diakritiky a interpunkcie. */
export function normalizeSearch(s: string): string {
  return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
