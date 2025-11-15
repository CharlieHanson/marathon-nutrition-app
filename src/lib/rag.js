// src/lib/rag.js
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // service role for RPC
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function buildPreferenceQuery({ mealType, likes, dislikes, cuisines, goal, intensityText }) {
  return [
    mealType ? `meal type: ${mealType}` : '',
    goal ? `goal: ${goal}` : '',
    cuisines ? `cuisines: ${cuisines}` : '',
    likes ? `likes: ${likes}` : '',
    dislikes ? `dislikes: ${dislikes}` : '',
    intensityText ? `training: ${intensityText}` : '',
  ].filter(Boolean).join('\n');
}

export async function getTopMealsByVector({
  userId,
  mealType,
  likes,
  dislikes,
  cuisines,
  goal,
  intensityText,
  k = 8,
}) {
  // 1) Embed query text
  const query = buildPreferenceQuery({ mealType, likes, dislikes, cuisines, goal, intensityText });
  const emb = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query || 'generic meal',
  });
  const query_embedding = emb.data[0].embedding;

  // 2) RPC call — parameter names MUST match the function
  const { data, error } = await supabaseAdmin.rpc('match_meal_ratings', {
    p_user_id: userId,
    p_meal_type: mealType || null,
    p_query_embedding: query_embedding,
    p_match_count: k,
  });

  if (error) throw error;
  return data || [];
}

// --- simple Jaccard similarity on token sets ---
function jaccard(a, b) {
  const A = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const B = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const inter = [...A].filter(x => B.has(x)).length;
  const denom = A.size + B.size - inter || 1;
  return inter / denom;
}

// Pick k diverse items from a sorted pool, rejecting near-duplicates
export function selectDiverse(items, { k = 5, maxSim = 0.35, textKey = 'meal_description' } = {}) {
  const picked = [];
  for (const item of items || []) {
    const text = (item?.[textKey] || '').toString();
    if (!text) continue;
    if (picked.length === 0) { picked.push(item); continue; }
    const tooSimilar = picked.some(p => jaccard(text, (p?.[textKey] || '').toString()) > maxSim);
    if (!tooSimilar) picked.push(item);
    if (picked.length >= k) break;
  }
  return picked;
}

// Pull dessert-only exemplars, diversify them, return top-k
export async function getPersonalizedDessertExemplars({ userId, k = 5, pool = 20 }) {
  if (!userId) return [];

  // embed a generic dessert query; you can make this smarter if you want
  const emb = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'highly rated dessert ideas for athletes',
  });
  const query_embedding = emb.data[0].embedding;

  // Use your RPC; filter meal_type='dessert' and ask for a bigger pool
  const { data, error } = await supabaseAdmin.rpc('match_meal_ratings', {
    p_user_id: userId,
    p_meal_type: 'dessert',
    p_query_embedding: query_embedding,
    p_match_count: pool,
  });
  if (error) throw error;

  // De-dup by lexical similarity, keep k
  return selectDiverse(data || [], { k, maxSim: 0.35, textKey: 'meal_description' });
}