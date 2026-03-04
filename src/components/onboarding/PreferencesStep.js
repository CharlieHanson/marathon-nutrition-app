// src/components/onboarding/PreferencesStep.js
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronRight } from 'lucide-react';

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
  'Caribbean', 'Brazilian', 'Hawaiian', 'German', 'Filipino',
];

export const PreferencesStep = ({ preferences, onUpdate, onComplete, onBack, isSaving }) => {
  const [likedFoods, setLikedFoods] = useState(new Set());
  const [dislikedFoods, setDislikedFoods] = useState(new Set());
  const [favoriteCuisines, setFavoriteCuisines] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set(['proteins']));
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Sync parent preferences string → local sets (on initial load)
  useEffect(() => {
    if (!preferences.likes && !preferences.dislikes && !preferences.cuisineFavorites) return;

    if (preferences.likes) {
      const liked = preferences.likes.split(',').map((f) => f.trim()).filter((f) => ALL_CATEGORY_FOODS.includes(f));
      setLikedFoods(new Set(liked));
    }
    if (preferences.dislikes) {
      const disliked = preferences.dislikes.split(',').map((f) => f.trim()).filter((f) => ALL_CATEGORY_FOODS.includes(f));
      setDislikedFoods(new Set(disliked));
    }
    if (preferences.cuisineFavorites) {
      const cuisines = preferences.cuisineFavorites.split(',').map((c) => c.trim()).filter((c) => COMMON_CUISINES.includes(c));
      setFavoriteCuisines(new Set(cuisines));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.likes, preferences.dislikes, preferences.cuisineFavorites]);

  // Sync local sets → parent preferences strings
  useEffect(() => {
    onUpdateRef.current('likes', Array.from(likedFoods).join(', '));
    onUpdateRef.current('dislikes', Array.from(dislikedFoods).join(', '));
    onUpdateRef.current('cuisineFavorites', Array.from(favoriteCuisines).join(', '));
  }, [likedFoods, dislikedFoods, favoriteCuisines]);

  const toggleLike = (food) => {
    setLikedFoods((prev) => {
      const next = new Set(prev);
      if (next.has(food)) { next.delete(food); }
      else { next.add(food); setDislikedFoods((d) => { const nd = new Set(d); nd.delete(food); return nd; }); }
      return next;
    });
  };

  const toggleDislike = (food) => {
    setDislikedFoods((prev) => {
      const next = new Set(prev);
      if (next.has(food)) { next.delete(food); }
      else { next.add(food); setLikedFoods((l) => { const nl = new Set(l); nl.delete(food); return nl; }); }
      return next;
    });
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
    setFavoriteCuisines((prev) => {
      const next = new Set(prev);
      if (next.has(cuisine)) next.delete(cuisine);
      else next.add(cuisine);
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            What are your food preferences?
          </h2>
          <p className="text-gray-600">
            Use thumbs up/down to mark foods you like or dislike. Select your favorite cuisines below.
          </p>
        </div>

        {/* Foods by Category */}
        <div className="mb-8 space-y-2">
          {FOOD_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            return (
              <div key={category.id} className="rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
                >
                  <h3 className="text-base font-semibold text-gray-900">{category.name}</h3>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {category.foods.map((food) => {
                        const isLiked = likedFoods.has(food);
                        const isDisliked = dislikedFoods.has(food);
                        return (
                          <div
                            key={food}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                              isLiked
                                ? 'bg-green-50 border-green-300'
                                : isDisliked
                                ? 'bg-red-50 border-red-300'
                                : 'bg-gray-50 border-gray-200 hover:border-primary/50'
                            }`}
                          >
                            <span className="text-sm font-medium text-gray-700 flex-1 truncate">{food}</span>
                            <div className="flex gap-1 ml-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleLike(food)}
                                className={`p-1 rounded transition-all ${
                                  isLiked
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white text-gray-400 hover:bg-green-100 hover:text-green-600'
                                }`}
                                title={isLiked ? 'Remove from likes' : 'Like'}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleDislike(food)}
                                className={`p-1 rounded transition-all ${
                                  isDisliked
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white text-gray-400 hover:bg-red-100 hover:text-red-600'
                                }`}
                                title={isDisliked ? 'Remove from dislikes' : 'Dislike'}
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Favorite Cuisines */}
        <div className="mb-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Cuisines</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {COMMON_CUISINES.map((cuisine) => {
              const isFavorite = favoriteCuisines.has(cuisine);
              return (
                <div
                  key={cuisine}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    isFavorite
                      ? 'bg-primary/10 border-primary'
                      : 'bg-gray-50 border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-700 flex-1 truncate">{cuisine}</span>
                  <button
                    type="button"
                    onClick={() => toggleCuisine(cuisine)}
                    className={`ml-2 p-1 rounded transition-all ${
                      isFavorite
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-400 hover:bg-primary/10 hover:text-primary'
                    }`}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline" className="flex-1">
            Back
          </Button>
          <Button
            onClick={onComplete}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Complete Setup'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
