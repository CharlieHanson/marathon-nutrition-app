// pages/pro/clients/[id].js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../src/supabaseClient';
import { ProLayout } from '../../../src/views/pro/ProLayout';
import { Card } from '../../../src/components/shared/Card';
import { Button } from '../../../src/components/shared/Button';
import { Input } from '../../../src/components/shared/Input';
import { ArrowLeft, Save } from 'lucide-react';

export default function ClientDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState('');
  const [userName, setUserName] = useState('');
  const [notes, setNotes] = useState('');
  const [currentWeekMeals, setCurrentWeekMeals] = useState(null);
  
  // Macro boundaries that nutritionist can edit
  const [macroBounds, setMacroBounds] = useState({
    kcal_min: '',
    kcal_max: '',
    protein_min: '',
    protein_max: '',
    carbs_min: '',
    carbs_max: '',
    fat_min: '',
    fat_max: '',
  });

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
    fetchNutritionistName();
  }, [id]);

  const fetchNutritionistName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: nutritionistData } = await supabase
          .from('nutritionists')
          .select('name')
          .eq('user_id', user.id)
          .single();
        
        if (nutritionistData?.name) {
          setUserName(nutritionistData.name);
        }
      }
    } catch (error) {
      console.error('Error fetching nutritionist name:', error);
    }
  };

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // Fetch client name from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      setClientName(profileData.name || 'Unnamed Client');

      // Fetch client_nutritionist data (macro bounds + notes)
      const { data: clientNutData, error: clientNutError } = await supabase
        .from('client_nutritionist')
        .select('*')
        .eq('client_user_id', id)
        .single();

      if (clientNutError && clientNutError.code !== 'PGRST116') {
        console.error('Client nutritionist error:', clientNutError);
      }
      
      if (clientNutData) {
        setMacroBounds({
          kcal_min: clientNutData.kcal_min || '',
          kcal_max: clientNutData.kcal_max || '',
          protein_min: clientNutData.protein_min || '',
          protein_max: clientNutData.protein_max || '',
          carbs_min: clientNutData.carbs_min || '',
          carbs_max: clientNutData.carbs_max || '',
          fat_min: clientNutData.fat_min || '',
          fat_max: clientNutData.fat_max || '',
        });
        setNotes(clientNutData.notes || '');
      }

      // Fetch current week's meal plan
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString().split('T')[0]; // YYYY-MM-DD format

      // First check if ANY meal plans exist for this user
      const { data: allPlans, error: allPlansError } = await supabase
        .from('meal_plans')
        .select('id, week_starting, created_at')
        .eq('user_id', id);

      console.log('🔍 All meal plans for user:', { allPlans, count: allPlans?.length });

      // Get the most recent meal plan that's not in the future
      const { data: mealPlanData, error: mealPlanError } = await supabase
        .from('meal_plans')
        .select('week_starting, meals')
        .eq('user_id', id)
        .lte('week_starting', todayISO) // Only get plans that have started (week_starting <= today)
        .order('week_starting', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('🔍 Meal plan query result:', { mealPlanData, mealPlanError });
      console.log('🔍 User ID being queried:', id);
      console.log('🔍 Today\'s date:', todayISO);

      if (mealPlanError && mealPlanError.code !== 'PGRST116') {
        console.error('Meal plan error:', mealPlanError);
        console.error('Meal plan error details:', JSON.stringify(mealPlanError, null, 2));
      }
      
      if (mealPlanData) {
        console.log('✅ Meal plan found:', {
          week_starting: mealPlanData.week_starting,
          hasMeals: !!mealPlanData.meals,
          mealsKeys: mealPlanData.meals ? Object.keys(mealPlanData.meals) : []
        });
      } else {
        console.log('❌ No meal plan data returned');
      }
      
      setCurrentWeekMeals(mealPlanData || null);

    } catch (error) {
      console.error('Error fetching client data:', error);
      setMessage('❌ Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const saveClientData = async () => {
    setSaving(true);
    setMessage('🔄 Saving...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get the nutritionist record ID from the nutritionists table
      const { data: nutritionistData, error: nutritionistError } = await supabase
        .from('nutritionists')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (nutritionistError) {
        console.error('Nutritionist lookup error:', nutritionistError);
        throw new Error('Failed to find nutritionist record');
      }

      const nutritionistId = nutritionistData.id;
      
      const { error } = await supabase
        .from('client_nutritionist')
        .upsert({
          client_user_id: id,
          nutritionist_id: nutritionistId,
          kcal_min: macroBounds.kcal_min ? parseInt(macroBounds.kcal_min) : null,
          kcal_max: macroBounds.kcal_max ? parseInt(macroBounds.kcal_max) : null,
          protein_min: macroBounds.protein_min ? parseInt(macroBounds.protein_min) : null,
          protein_max: macroBounds.protein_max ? parseInt(macroBounds.protein_max) : null,
          carbs_min: macroBounds.carbs_min ? parseInt(macroBounds.carbs_min) : null,
          carbs_max: macroBounds.carbs_max ? parseInt(macroBounds.carbs_max) : null,
          fat_min: macroBounds.fat_min ? parseInt(macroBounds.fat_min) : null,
          fat_max: macroBounds.fat_max ? parseInt(macroBounds.fat_max) : null,
          notes: notes,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'client_user_id'
        });

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }

      setMessage('✅ Saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      setMessage(`❌ Failed to save: ${error.message || 'Unknown error'}`);
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const updateBound = (field, value) => {
    setMacroBounds(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <ProLayout userName={userName} onSignOut={handleSignOut}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </ProLayout>
    );
  }

  return (
    <ProLayout userName={userName} onSignOut={handleSignOut}>
      {/* Back Button */}
      <div className="mb-6">
        <Button
          onClick={() => router.push('/pro/clients')}
          variant="ghost"
          icon={ArrowLeft}
          size="sm"
        >
          Back to Clients
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {clientName}
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Client ID: {id}
        </p>
      </div>
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.includes('✅') 
              ? 'bg-green-50 border-green-500 text-green-800'
              : message.includes('❌')
              ? 'bg-red-50 border-red-500 text-red-800'
              : 'bg-blue-50 border-blue-500 text-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.includes('🔄') && (
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              )}
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Macro Boundaries */}
          <Card 
            title="Macro Boundaries" 
            subtitle="Set min/max ranges for this client's meal plans"
          >
            <div className="space-y-6">
              {/* Calories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Calories (kcal)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Min (e.g., 2000)"
                    value={macroBounds.kcal_min}
                    onChange={(e) => updateBound('kcal_min', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max (e.g., 2500)"
                    value={macroBounds.kcal_max}
                    onChange={(e) => updateBound('kcal_max', e.target.value)}
                  />
                </div>
              </div>

              {/* Protein */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Protein (grams)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Min (e.g., 120)"
                    value={macroBounds.protein_min}
                    onChange={(e) => updateBound('protein_min', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max (e.g., 180)"
                    value={macroBounds.protein_max}
                    onChange={(e) => updateBound('protein_max', e.target.value)}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carbohydrates (grams)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Min (e.g., 200)"
                    value={macroBounds.carbs_min}
                    onChange={(e) => updateBound('carbs_min', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max (e.g., 300)"
                    value={macroBounds.carbs_max}
                    onChange={(e) => updateBound('carbs_max', e.target.value)}
                  />
                </div>
              </div>

              {/* Fats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fats (grams)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Min (e.g., 50)"
                    value={macroBounds.fat_min}
                    onChange={(e) => updateBound('fat_min', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max (e.g., 80)"
                    value={macroBounds.fat_max}
                    onChange={(e) => updateBound('fat_max', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card title="Notes" subtitle="Private notes about this client">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this client's progress, preferences, or any special considerations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
              rows="5"
            />
          </Card>

          {/* Save Button */}
          <Button 
            onClick={saveClientData} 
            disabled={saving}
            icon={Save}
            className="w-full sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>

          {/* Current Week Meal Plan */}
          <Card 
            title="Current Week Meal Plan" 
            subtitle={currentWeekMeals?.week_starting ? `Week starting ${new Date(currentWeekMeals.week_starting).toLocaleDateString()}` : 'No meal plan generated yet'}
          >
            {currentWeekMeals?.meals && Object.keys(currentWeekMeals.meals).length > 0 ? (
              <div className="space-y-4">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const meals = currentWeekMeals.meals[day];
                  
                  // Check if this day has any actual meals
                  const hasMeals = meals && typeof meals === 'object' && 
                    Object.entries(meals).some(([mealType, meal]) => 
                      !mealType.includes('_rating') && 
                      meal && 
                      typeof meal === 'string' && 
                      meal.trim()
                    );

                  if (!hasMeals) return null;

                  return (
                    <div key={day} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <h3 className="font-semibold text-gray-900 capitalize mb-2">
                        {day}
                      </h3>
                      <div className="space-y-2 ml-4">
                        {Object.entries(meals).map(([mealType, meal]) => {
                          // Skip rating fields and empty meals
                          if (mealType.includes('_rating') || !meal || typeof meal !== 'string' || !meal.trim()) {
                            return null;
                          }
                          return (
                            <div key={mealType} className="text-sm">
                              <span className="font-medium text-gray-700 capitalize">
                                {mealType}:
                              </span>{' '}
                              <span className="text-gray-600">{meal}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">
                No meal plan has been generated for this client yet.
              </p>
            )}
          </Card>
        </div>
      </ProLayout>
    );
  }