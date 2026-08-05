import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/src/components/ui/collapsible';

import { Save, Lock, ThumbsUp, ThumbsDown, ChevronDown, ChevronRight } from 'lucide-react';
import { PreferencesSkeleton } from '../components/shared/LoadingSkeleton';

// Food categories (matches mobile structure)
const FOOD_CATEGORIES = [
  {
    id: 'proteins',
    name: 'Proteins',
    foods: ['Chicken', 'Salmon', 'Beef', 'Turkey', 'Pork', 'Shrimp', 'Tuna', 'Cod', 'Tofu'],
  },
  {
    id: 'dairy',
    name: 'Dairy & Eggs',
    foods: ['Eggs', 'Greek Yogurt', 'Cottage Cheese', 'Milk', 'Cheese', 'Mozzarella', 'Feta', 'Butter', 'Cream Cheese'],
  },
  {
    id: 'carbs',
    name: 'Grains & Carbs',
    foods: ['Quinoa', 'Rice', 'Pasta', 'Oats', 'Bread', 'Tortillas', 'Couscous', 'Potatoes', 'Granola'],
  },
  {
    id: 'fruits',
    name: 'Fruits',
    foods: ['Avocado', 'Bananas', 'Berries', 'Apples', 'Oranges', 'Mango', 'Strawberries', 'Watermelon', 'Peaches'],
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    foods: [
      'Spinach', 'Broccoli', 'Cucumber', 'Sweet Potato', 'Carrots', 'Tomatoes',
      'Peppers', 'Kale', 'Cauliflower', 'Zucchini', 'Mushrooms', 'Onions',
    ],
  },
  {
    id: 'nuts',
    name: 'Nuts & Legumes',
    foods: ['Nuts', 'Almonds', 'Peanut Butter', 'Beans', 'Lentils', 'Chickpeas'],
  },
  {
    id: 'other',
    name: 'Other',
    foods: ['Garlic', 'Hummus', 'Olive Oil', 'Vinegar', 'Soy Sauce', 'Hot Sauce', 'Salsa', 'Honey', 'Mayonnaise'],
  },
];

const ALL_CATEGORY_FOODS = FOOD_CATEGORIES.flatMap((c) => c.foods);

const COMMON_CUISINES = [
  'Mediterranean', 'Italian', 'Mexican', 'Chinese', 'Japanese',
  'Thai', 'Indian', 'American', 'Greek', 'Korean',
  'Vietnamese', 'Spanish', 'French', 'Middle Eastern', 'Turkish',
  'Caribbean', 'Brazilian', 'Hawaiian', 'German', 'Filipino'
];

export const FoodPreferencesPage = ({ 
  preferences, 
  onUpdate, 
  onSave, 
  isSaving,
  isLoading = false,
  isGuest 
}) => {
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [likedFoods, setLikedFoods] = useState(new Set());
  const [dislikedFoods, setDislikedFoods] = useState(new Set());
  const [otherLikes, setOtherLikes] = useState('');
  const [otherDislikes, setOtherDislikes] = useState('');
  const [favoriteCuisines, setFavoriteCuisines] = useState(new Set());
  const [otherCuisines, setOtherCuisines] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['proteins']));
  const onUpdateRef = useRef(onUpdate);

  // Keep onUpdate ref up to date
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

// Parse existing preferences when component loads or preferences change
useEffect(() => {
  // Only parse if preferences actually changed (not empty)
  if (!preferences.likes && !preferences.dislikes && !preferences.cuisineFavorites) {
    return; // Skip if all empty (prevents overwriting on initial render)
  }

  if (preferences.likes) {
    const likesArray = preferences.likes.split(',').map(f => f.trim()).filter(f => f);
    const commonLikes = likesArray.filter(f => ALL_CATEGORY_FOODS.includes(f));
    const otherLikesList = likesArray.filter(f => !ALL_CATEGORY_FOODS.includes(f));
    
    setLikedFoods(new Set(commonLikes));
    setOtherLikes(otherLikesList.join(', '));
  } else {
    setLikedFoods(new Set());
    setOtherLikes('');
  }

  if (preferences.dislikes) {
    const dislikesArray = preferences.dislikes.split(',').map(f => f.trim()).filter(f => f);
    const commonDislikes = dislikesArray.filter(f => ALL_CATEGORY_FOODS.includes(f));
    const otherDislikesList = dislikesArray.filter(f => !ALL_CATEGORY_FOODS.includes(f));
    
    setDislikedFoods(new Set(commonDislikes));
    setOtherDislikes(otherDislikesList.join(', '));
  } else {
    setDislikedFoods(new Set());
    setOtherDislikes('');
  }

  if (preferences.cuisineFavorites) {
    const cuisinesArray = preferences.cuisineFavorites.split(',').map(c => c.trim()).filter(c => c);
    const commonCuisinesList = cuisinesArray.filter(c => COMMON_CUISINES.includes(c));
    const otherCuisinesList = cuisinesArray.filter(c => !COMMON_CUISINES.includes(c));
    
    setFavoriteCuisines(new Set(commonCuisinesList));
    setOtherCuisines(otherCuisinesList.join(', '));
  } else {
    setFavoriteCuisines(new Set());
    setOtherCuisines('');
  }
}, [preferences.likes, preferences.dislikes, preferences.cuisineFavorites]);

  // Update preferences whenever local state changes
  useEffect(() => {
    const allLikes = [
      ...Array.from(likedFoods),
      ...otherLikes.split(',').map(f => f.trim()).filter(f => f)
    ].filter(f => f).join(', ');
    
    const allDislikes = [
      ...Array.from(dislikedFoods),
      ...otherDislikes.split(',').map(f => f.trim()).filter(f => f)
    ].filter(f => f).join(', ');

    const allCuisines = [
      ...Array.from(favoriteCuisines),
      ...otherCuisines.split(',').map(c => c.trim()).filter(c => c)
    ].filter(c => c).join(', ');

    // Update parent component state using ref to avoid dependency issues
    onUpdateRef.current('likes', allLikes);
    onUpdateRef.current('dislikes', allDislikes);
    onUpdateRef.current('cuisineFavorites', allCuisines);
  }, [likedFoods, dislikedFoods, otherLikes, otherDislikes, favoriteCuisines, otherCuisines]);
  const toggleLike = (food) => {
    if (isGuest) return;
    
    const newLiked = new Set(likedFoods);
    const newDisliked = new Set(dislikedFoods);
    
    if (newLiked.has(food)) {
      newLiked.delete(food);
    } else {
      newLiked.add(food);
      newDisliked.delete(food); // Remove from dislikes if it was there
    }
    
    setLikedFoods(newLiked);
    setDislikedFoods(newDisliked);
  };

  const toggleDislike = (food) => {
    if (isGuest) return;
    
    const newLiked = new Set(likedFoods);
    const newDisliked = new Set(dislikedFoods);
    
    if (newDisliked.has(food)) {
      newDisliked.delete(food);
    } else {
      newDisliked.add(food);
      newLiked.delete(food); // Remove from likes if it was there
    }
    
    setLikedFoods(newLiked);
    setDislikedFoods(newDisliked);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const toggleCuisine = (cuisine) => {
    if (isGuest) return;
    
    const newFavoriteCuisines = new Set(favoriteCuisines);
    
    if (newFavoriteCuisines.has(cuisine)) {
      newFavoriteCuisines.delete(cuisine);
    } else {
      newFavoriteCuisines.add(cuisine);
    }
    
    setFavoriteCuisines(newFavoriteCuisines);
  };

  const handleSave = async () => {
    const { error } = await onSave();
    if (!error) {
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } else {
      alert('Failed to save preferences');
    }
  };

  if (isLoading) {
    return <PreferencesSkeleton />;
  }

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex items-start justify-between gap-4 mb-6">
          <p className="text-gray-600">
            Select foods you like or dislike using the thumbs up/down buttons. Add any other foods in the &quot;Other&quot; sections below. Click save to save your preferences.
          </p>
          {!isGuest && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="primary"
              size="sm"
              icon={Save}
              className="shrink-0"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>

        {/* Foods by Category */}
        <div className="mb-8 space-y-2">
          {FOOD_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            return (
              <Collapsible
                key={category.id}
                open={isExpanded}
                onOpenChange={() => toggleCategory(category.id)}
                className="rounded-card border border-border overflow-hidden shadow-soft"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 bg-cream-200 hover:bg-cream-300 text-left transition-colors"
                  >
                    <h3 className="text-base font-semibold text-foreground">{category.name}</h3>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 bg-cream-50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {category.foods.map((food) => {
                        const isLiked = likedFoods.has(food);
                        const isDisliked = dislikedFoods.has(food);
                        return (
                          <div
                            key={food}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                              isLiked
                                ? 'bg-primary-50 border-primary-200'
                                : isDisliked
                                ? 'bg-[#F5E9E6] border-[#D4B5AE]'
                                : 'bg-cream-200 border-border'
                            } ${isGuest ? 'opacity-60' : 'hover:border-primary/40'}`}
                          >
                            <span className="text-sm font-medium text-foreground flex-1 truncate">{food}</span>
                            <div className="flex gap-1 ml-2 shrink-0">
                              <Button
                                onClick={() => toggleLike(food)}
                                disabled={isGuest}
                                variant={isLiked ? 'primary' : 'ghost'}
                                size="icon"
                                className={`h-8 w-8 ${
                                  isLiked
                                    ? ''
                                    : 'bg-card text-muted-foreground hover:bg-primary-50 hover:text-primary'
                                }`}
                                title={isLiked ? 'Remove from likes' : 'Add to likes'}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => toggleDislike(food)}
                                disabled={isGuest}
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${
                                  isDisliked
                                    ? 'bg-[#A66D63] text-white hover:bg-[#A66D63]'
                                    : 'bg-card text-muted-foreground hover:bg-[#F5E9E6] hover:text-[#A66D63]'
                                }`}
                                title={isDisliked ? 'Remove from dislikes' : 'Add to dislikes'}
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        {/* Other Foods Section */}
        <div className="space-y-6 border-t border-cream-300 pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other Foods I Like
            </label>
            <textarea
              placeholder="e.g., specific brands, regional foods, or other items not listed above (separated by commas)"
              value={otherLikes}
              onChange={(e) => setOtherLikes(e.target.value)}
              disabled={isGuest}
              className={`w-full px-4 py-3 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : 'bg-cream-200 hover:border-primary/50'
              }`}
              rows="3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Add any other foods you like that aren't in the list above
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other Foods I Dislike
            </label>
            <textarea
              placeholder="e.g., specific foods, ingredients, or items not listed above (separated by commas)"
              value={otherDislikes}
              onChange={(e) => setOtherDislikes(e.target.value)}
              disabled={isGuest}
              className={`w-full px-4 py-3 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : 'bg-cream-200 hover:border-primary/50'
              }`}
              rows="3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Add any other foods you dislike that aren't in the list above
            </p>
          </div>

        </div>

        {/* Favorite Cuisines Section */}
        <div className="mt-8 pt-6 border-t border-cream-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Cuisines</h3>
          
          {/* Common Cuisines Selection */}
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {COMMON_CUISINES.map((cuisine) => {
                const isFavorite = favoriteCuisines.has(cuisine);
                
                return (
                  <div
                    key={cuisine}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isFavorite
                        ? 'bg-primary/10 border-primary'
                        : 'bg-cream-200 border-cream-300'
                    } ${isGuest ? 'opacity-60' : 'hover:border-primary/50'}`}
                  >
                    <span className="text-sm font-medium text-gray-700 flex-1">{cuisine}</span>
                    <button
                      onClick={() => toggleCuisine(cuisine)}
                      disabled={isGuest}
                      className={`ml-2 p-1 rounded transition-all ${
                        isFavorite
                          ? 'bg-primary text-white'
                          : 'bg-white text-gray-400 hover:bg-primary/10 hover:text-primary'
                      } ${isGuest ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Other Cuisines */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other Favorite Cuisines
            </label>
            <textarea
              placeholder="e.g., specific regional cuisines or styles not listed above (separated by commas)"
              value={otherCuisines}
              onChange={(e) => setOtherCuisines(e.target.value)}
              disabled={isGuest}
              className={`w-full px-4 py-3 border border-cream-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : 'bg-cream-200 hover:border-primary/50'
              }`}
              rows="3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Add any other cuisines you prefer that aren't in the list above
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-cream-300">
          {!isGuest ? (
            <div className="flex items-center gap-4">
              <Button onClick={handleSave} disabled={isSaving} icon={Save} size="lg">
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>

              {showSaveConfirmation && (
                <div className="px-4 py-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 flex items-center gap-2 shadow-sm">
                  <span className="text-xl">✓</span>
                  <span className="font-medium">Preferences saved successfully!</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full p-5 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg flex items-start gap-4 shadow-sm">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900 mb-1">Guest Mode</p>
                <p className="text-sm text-amber-700">
                  You're browsing in guest mode. Create an account or sign in to save your preferences and get personalized meal plans.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default FoodPreferencesPage;