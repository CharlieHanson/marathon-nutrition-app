import React, { useState, useEffect, useRef } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/src/components/ui/collapsible';

import { Lock, ThumbsUp, ThumbsDown, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../components/shared/Button';
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
  isSaving,
  isLoading = false,
  isGuest,
}) => {
  const [showSaved, setShowSaved] = useState(false);
  const [wasSaving, setWasSaving] = useState(false);
  const [likedFoods, setLikedFoods] = useState(new Set());
  const [dislikedFoods, setDislikedFoods] = useState(new Set());
  const [otherLikes, setOtherLikes] = useState('');
  const [otherDislikes, setOtherDislikes] = useState('');
  const [favoriteCuisines, setFavoriteCuisines] = useState(new Set());
  const [otherCuisines, setOtherCuisines] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['proteins']));
  const onUpdateRef = useRef(onUpdate);
  // Skip syncing local → parent once after hydrating from server prefs (same render cycle still has stale empty local state)
  const skipNextSyncRef = useRef(true);

  // Keep onUpdate ref up to date
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (isSaving) {
      setWasSaving(true);
      setShowSaved(false);
      return undefined;
    }
    if (wasSaving) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      setWasSaving(false);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isSaving, wasSaving]);

  // Parse existing preferences when component loads or preferences change
  useEffect(() => {
    if (preferences.likes) {
      const likesArray = preferences.likes.split(',').map((f) => f.trim()).filter((f) => f);
      const commonLikes = likesArray.filter((f) => ALL_CATEGORY_FOODS.includes(f));
      const otherLikesList = likesArray.filter((f) => !ALL_CATEGORY_FOODS.includes(f));

      setLikedFoods(new Set(commonLikes));
      setOtherLikes(otherLikesList.join(', '));
    } else {
      setLikedFoods(new Set());
      setOtherLikes('');
    }

    if (preferences.dislikes) {
      const dislikesArray = preferences.dislikes.split(',').map((f) => f.trim()).filter((f) => f);
      const commonDislikes = dislikesArray.filter((f) => ALL_CATEGORY_FOODS.includes(f));
      const otherDislikesList = dislikesArray.filter((f) => !ALL_CATEGORY_FOODS.includes(f));

      setDislikedFoods(new Set(commonDislikes));
      setOtherDislikes(otherDislikesList.join(', '));
    } else {
      setDislikedFoods(new Set());
      setOtherDislikes('');
    }

    if (preferences.cuisineFavorites) {
      const cuisinesArray = preferences.cuisineFavorites.split(',').map((c) => c.trim()).filter((c) => c);
      const commonCuisinesList = cuisinesArray.filter((c) => COMMON_CUISINES.includes(c));
      const otherCuisinesList = cuisinesArray.filter((c) => !COMMON_CUISINES.includes(c));

      setFavoriteCuisines(new Set(commonCuisinesList));
      setOtherCuisines(otherCuisinesList.join(', '));
    } else {
      setFavoriteCuisines(new Set());
      setOtherCuisines('');
    }

    skipNextSyncRef.current = true;
  }, [preferences.likes, preferences.dislikes, preferences.cuisineFavorites]);

  // Update preferences whenever local state changes
  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const allLikes = [
      ...Array.from(likedFoods),
      ...otherLikes.split(',').map((f) => f.trim()).filter((f) => f),
    ]
      .filter((f) => f)
      .join(', ');

    const allDislikes = [
      ...Array.from(dislikedFoods),
      ...otherDislikes.split(',').map((f) => f.trim()).filter((f) => f),
    ]
      .filter((f) => f)
      .join(', ');

    const allCuisines = [
      ...Array.from(favoriteCuisines),
      ...otherCuisines.split(',').map((c) => c.trim()).filter((c) => c),
    ]
      .filter((c) => c)
      .join(', ');

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

  if (isLoading) {
    return <PreferencesSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 min-h-[28px]">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900">Food Preferences</h2>
          <p className="text-gray-600">
            Mark foods you like or dislike. Changes save automatically.
          </p>
        </div>
        {!isGuest ? (
          <div className="text-sm text-gray-500 pt-1">
            {isSaving ? (
              <span>Saving…</span>
            ) : showSaved ? (
              <span className="text-green-700">Saved</span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Foods by Category */}
      <div className="space-y-4">
        {FOOD_CATEGORIES.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          return (
            <Collapsible
              key={category.id}
              open={isExpanded}
              onOpenChange={() => toggleCategory(category.id)}
              className="bg-cream-50 border border-cream-300 rounded-card shadow-soft overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-cream-100/80"
                >
                  <h3 className="text-base font-semibold text-gray-900">{category.name}</h3>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-600 shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600 shrink-0" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4">
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
                              : 'bg-cream-200 border-cream-300'
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
      <div className="space-y-6">
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
            Add any other foods you like that aren&apos;t in the list above
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
            Add any other foods you dislike that aren&apos;t in the list above
          </p>
        </div>
      </div>

      {/* Favorite Cuisines Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Cuisines</h3>

        <div className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {COMMON_CUISINES.map((cuisine) => {
              const isFavorite = favoriteCuisines.has(cuisine);

              return (
                <div
                  key={cuisine}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isFavorite
                      ? 'bg-primary-50 border-primary-200'
                      : 'bg-cream-200 border-cream-300'
                  } ${isGuest ? 'opacity-60' : 'hover:border-primary/40'}`}
                >
                  <span className="text-sm font-medium text-gray-700 flex-1">{cuisine}</span>
                  <button
                    onClick={() => toggleCuisine(cuisine)}
                    disabled={isGuest}
                    className={`ml-2 p-1 rounded transition-all ${
                      isFavorite
                        ? 'bg-primary text-white'
                        : 'bg-card text-muted-foreground hover:bg-primary-50 hover:text-primary'
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
            Add any other cuisines you prefer that aren&apos;t in the list above
          </p>
        </div>
      </div>

      {isGuest ? (
        <div className="w-full p-5 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg flex items-start gap-4 shadow-sm">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-900 mb-1">Guest Mode</p>
            <p className="text-sm text-amber-700">
              You&apos;re browsing in guest mode. Create an account or sign in to save your preferences and get personalized meal plans.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default FoodPreferencesPage;
