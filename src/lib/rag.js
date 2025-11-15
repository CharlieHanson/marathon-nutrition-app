// src/lib/rag.js
import { supabaseAdmin } from './supabaseAdmin.js';

/**
 * Fetch the user's highly-rated meals for personalization.
 * You can later add a vector search here (pgvector RPC) if desired.
 */
export async function getPersonalizedPreferences({ userId, limit = 10 }) {
  if (!userId) return [];

  const { data, error } = await supabaseAdmin
    .from('meal_ratings')
    .select('meal_description, meal_type, rating, day, created_at')
    .eq('user_id', userId)
    .gte('rating', 4)
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
