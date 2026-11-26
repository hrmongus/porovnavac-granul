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
}

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
  const scores = await fetchAll<{ score_total: number | null }>(sb, 'products', 'score_total');
  const marketScores = scores.map((s) => s.score_total).filter((s): s is number => s !== null).sort((a, b) => a - b);
  const data = { aliases, ingredients, marketScores };
  cache = { at: Date.now(), data };
  return data;
}

/** Podiel granúl trhu s nižším skóre (0–100 %). */
export function percentileBelow(score: number, marketScores: number[]): number {
  if (marketScores.length === 0) return 0;
  const lower = marketScores.filter((s) => s < score).length;
  return Math.round((lower / marketScores.length) * 100);
}
