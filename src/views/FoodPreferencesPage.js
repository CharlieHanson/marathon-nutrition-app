import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Save, Lock, ThumbsUp, ThumbsDown } from 'lucide-react';

const COMMON_FOODS = [
  // Proteins
  'Chicken', 'Salmon', 'Beef', 'Turkey', 'Pork', 'Shrimp', 'Tuna', 'Cod',
  // Dairy & Eggs
  'Eggs', 'Greek Yogurt', 'Cottage Cheese', 'Milk', 'Cheese', 'Mozzarella', 'Feta',
  // Grains & Carbs
  'Quinoa', 'Rice', 'Pasta', 'Oats', 'Bread', 'Tortillas', 'Couscous', 'Potatoes',
  // Fruits
  'Avocado', 'Banana', 'Berries', 'Apple', 'Orange', 'Mango', 'Strawberries',
  // Vegetables
  'Spinach', 'Broccoli', 'Sweet Potato', 'Carrots', 'Tomatoes', 'Peppers', 'Kale', 'Cauliflower', 'Zucchini',
  // Nuts & Legumes
  'Nuts', 'Almonds', 'Peanut Butter', 'Beans', 'Lentils', 'Chickpeas',
  // Other
  'Tofu', 'Mushrooms', 'Onions', 'Garlic', 'Hummus'
];

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
  isGuest 
}) => {
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [likedFoods, setLikedFoods] = useState(new Set());
  const [dislikedFoods, setDislikedFoods] = useState(new Set());
  const [otherLikes, setOtherLikes] = useState('');
  const [otherDislikes, setOtherDislikes] = useState('');
  const [favoriteCuisines, setFavoriteCuisines] = useState(new Set());
  const [otherCuisines, setOtherCuisines] = useState('');
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
    const commonLikes = likesArray.filter(f => COMMON_FOODS.includes(f));
    const otherLikesList = likesArray.filter(f => !COMMON_FOODS.includes(f));
    
    setLikedFoods(new Set(commonLikes));
    setOtherLikes(otherLikesList.join(', '));
  } else {
    setLikedFoods(new Set());
    setOtherLikes('');
  }

  if (preferences.dislikes) {
    const dislikesArray = preferences.dislikes.split(',').map(f => f.trim()).filter(f => f);
    const commonDislikes = dislikesArray.filter(f => COMMON_FOODS.includes(f));
    const otherDislikesList = dislikesArray.filter(f => !COMMON_FOODS.includes(f));
    
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

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
        Food Preferences
      </h2>
      
      <Card>
        <div className="mb-6">
          <p className="text-gray-600">
            Select foods you like or dislike using the thumbs up/down buttons. Add any other foods in the "Other" sections below.
          </p>
        </div>

        {/* Common Foods Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Foods</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {COMMON_FOODS.map((food) => {
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
                      : 'bg-gray-50 border-gray-200'
                  } ${isGuest ? 'opacity-60' : 'hover:border-primary/50'}`}
                >
                  <span className="text-sm font-medium text-gray-700 flex-1">{food}</span>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => toggleLike(food)}
                      disabled={isGuest}
                      className={`p-1 rounded transition-all ${
                        isLiked
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-400 hover:bg-green-100 hover:text-green-600'
                      } ${isGuest ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      title={isLiked ? 'Remove from likes' : 'Add to likes'}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleDislike(food)}
                      disabled={isGuest}
                      className={`p-1 rounded transition-all ${
                        isDisliked
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-400 hover:bg-red-100 hover:text-red-600'
                      } ${isGuest ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      title={isDisliked ? 'Remove from dislikes' : 'Add to dislikes'}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Other Foods Section */}
        <div className="space-y-6 border-t border-gray-200 pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other Foods I Like
            </label>
            <textarea
              placeholder="e.g., specific brands, regional foods, or other items not listed above (separated by commas)"
              value={otherLikes}
              onChange={(e) => setOtherLikes(e.target.value)}
              disabled={isGuest}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-primary/50'
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
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-primary/50'
              }`}
              rows="3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Add any other foods you dislike that aren't in the list above
            </p>
          </div>

        </div>

        {/* Favorite Cuisines Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
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
                        : 'bg-gray-50 border-gray-200'
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
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                isGuest ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-primary/50'
              }`}
              rows="3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Add any other cuisines you prefer that aren't in the list above
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          {!isGuest ? (
            <div className="flex items-center gap-4">
              <Button onClick={handleSave} disabled={isSaving} icon={Save} size="lg">
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>

              {showSaveConfirmation && (
                <div className="px-4 py-3 bg-green-50 border border-green-500 rounded-lg text-green-700 flex items-center gap-2 shadow-sm">
                  <span className="text-xl">✓</span>
                  <span className="font-medium">Preferences saved successfully!</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg flex items-start gap-4 shadow-sm">
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