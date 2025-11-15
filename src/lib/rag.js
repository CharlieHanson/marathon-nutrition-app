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
