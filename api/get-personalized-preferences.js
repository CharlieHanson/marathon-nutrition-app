import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, trainingPlan } = req.body;

    if (!userId) {
      return res.status(200).json({ 
        success: true, 
        preferences: [] 
      });
    }

    console.log('🔍 Retrieving personalized meal preferences for user:', userId);

    // Create a query based on training context
    const trainingContext = Object.entries(trainingPlan || {})
      .map(([day, data]) => {
        if (data.workouts && Array.isArray(data.workouts)) {
          return data.workouts.map(w => w.type).join(' ');
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');

    const queryText = trainingContext || 'healthy balanced athlete meals';

    // Generate query embedding
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: queryText,
    });

    // Search using weighted scoring
    const { data: similarMeals, error } = await supabaseAdmin
      .rpc('match_meal_ratings_weighted', {
        query_embedding: queryEmbedding.data[0].embedding,
        user_filter: userId,
        match_count: 8  // Get top 8, use top 5
      });

    if (error) {
      console.error('❌ Error retrieving preferences:', error);
      throw error;
    }

    console.log(`✅ Found ${similarMeals?.length || 0} highly-rated meals`);
    
    // Log scores for debugging (remove in production)
    if (similarMeals && similarMeals.length > 0) {
      console.log('📊 Top 3 meal scores:', 
        similarMeals.slice(0, 3).map(m => ({
          meal: m.meal_description.substring(0, 40),
          similarity: m.similarity?.toFixed(3),
          score: m.score?.toFixed(3),
          rating: m.rating
        }))
      );
    }

    return res.status(200).json({ 
      success: true, 
      preferences: similarMeals || []
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}