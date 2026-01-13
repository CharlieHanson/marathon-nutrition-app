// pages/api/delete-account.js
// Permanently deletes user account and all associated data
// Required for Apple App Store compliance

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role key to bypass RLS and delete auth user
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, confirmationText } = req.body;

  // Validate request
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }

  // Require user to type "DELETE" to confirm
  if (confirmationText !== 'DELETE') {
    return res.status(400).json({ 
      success: false, 
      error: 'Please type DELETE to confirm account deletion' 
    });
  }

  try {
    // Delete in order to avoid foreign key issues
    // Most dependent tables first, auth user last

    // 1. Delete meal ratings (has embeddings)
    const { error: ratingsError } = await supabase
      .from('meal_ratings')
      .delete()
      .eq('user_id', userId);
    
    if (ratingsError) {
      console.error('Error deleting meal_ratings:', ratingsError);
    }

    // 2. Delete saved meals
    const { error: savedMealsError } = await supabase
      .from('saved_meals')
      .delete()
      .eq('user_id', userId);
    
    if (savedMealsError) {
      console.error('Error deleting saved_meals:', savedMealsError);
    }

    // 3. Delete meal plans
    const { error: mealPlansError } = await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', userId);
    
    if (mealPlansError) {
      console.error('Error deleting meal_plans:', mealPlansError);
    }

    // 4. Delete training plans
    const { error: trainingError } = await supabase
      .from('training_plans')
      .delete()
      .eq('user_id', userId);
    
    if (trainingError) {
      console.error('Error deleting training_plans:', trainingError);
    }

    // 5. Delete food preferences
    const { error: prefsError } = await supabase
      .from('food_preferences')
      .delete()
      .eq('user_id', userId);
    
    if (prefsError) {
      console.error('Error deleting food_preferences:', prefsError);
    }

    // 6. Delete user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);
    
    if (profileError) {
      console.error('Error deleting user_profiles:', profileError);
    }

    // 7. Handle B2B relationships
    // Delete client-nutritionist relationships where user is the client
    const { error: clientRelError } = await supabase
      .from('client_nutritionist')
      .delete()
      .eq('client_user_id', userId);
    
    if (clientRelError) {
      console.error('Error deleting client_nutritionist (as client):', clientRelError);
    }

    // 8. Check if user is a nutritionist
    const { data: nutritionistData } = await supabase
      .from('nutritionists')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (nutritionistData) {
      // Delete all client relationships for this nutritionist
      const { error: nutClientError } = await supabase
        .from('client_nutritionist')
        .delete()
        .eq('nutritionist_id', nutritionistData.id);
      
      if (nutClientError) {
        console.error('Error deleting client_nutritionist (as nutritionist):', nutClientError);
      }

      // Delete nutritionist record
      const { error: nutError } = await supabase
        .from('nutritionists')
        .delete()
        .eq('user_id', userId);
      
      if (nutError) {
        console.error('Error deleting nutritionists:', nutError);
      }
    }

    // 9. Delete from profiles table
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profilesError) {
      console.error('Error deleting profiles:', profilesError);
    }

    // 10. Finally, delete the auth user (this is permanent!)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to delete authentication account. Please contact support.' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Account and all associated data permanently deleted' 
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'An error occurred during account deletion. Please contact support.' 
    });
  }
}