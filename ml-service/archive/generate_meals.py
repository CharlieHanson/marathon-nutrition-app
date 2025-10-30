import pandas as pd
import random
from itertools import combinations

def load_nutrition_data(filename='data/nutrition_data.csv'):
    """Load the USDA nutrition data"""
    df = pd.read_csv(filename)
    print(f"Loaded {len(df)} food items")
    return df

def categorize_foods(df):
    """Categorize foods into protein, carbs, vegetables, fats"""
    categories = {
        'protein': [],
        'carbs': [],
        'vegetables': [],
        'fats': []
    }
    
    # Keywords to identify categories
    protein_keywords = ['chicken', 'turkey', 'beef', 'salmon', 'tuna', 'fish', 
                       'egg', 'yogurt', 'cottage cheese', 'tofu', 'protein']
    carb_keywords = ['rice', 'quinoa', 'oat', 'potato', 'pasta', 'bread', 
                    'banana', 'apple', 'berry', 'orange', 'granola']
    veg_keywords = ['broccoli', 'spinach', 'kale', 'carrot', 'pepper', 
                   'asparagus', 'bean', 'tomato', 'cucumber', 'lettuce', 'salad']
    fat_keywords = ['almond', 'peanut', 'oil', 'walnut', 'chia', 'flax', 
                   'cashew', 'avocado', 'butter']
    
    for _, row in df.iterrows():
        desc = row['description'].lower()
        
        # Categorize based on keywords
        if any(keyword in desc for keyword in protein_keywords):
            categories['protein'].append(row)
        elif any(keyword in desc for keyword in carb_keywords):
            categories['carbs'].append(row)
        elif any(keyword in desc for keyword in veg_keywords):
            categories['vegetables'].append(row)
        elif any(keyword in desc for keyword in fat_keywords):
            categories['fats'].append(row)
    
    print(f"\nCategorized foods:")
    for cat, items in categories.items():
        print(f"  {cat}: {len(items)} items")
    
    return categories

def create_meal_combination(protein, carb, vegetable, fat=None):
    """Combine foods into a meal and sum macros"""
    
    # Typical serving sizes (grams)
    protein_serving = 150  # ~5oz chicken breast
    carb_serving = 150     # ~1 cup cooked rice
    veg_serving = 100      # ~1 cup vegetables
    fat_serving = 15       # ~1 tbsp
    
    # Calculate macros (USDA data is per 100g)
    protein_macros = {
        'calories': protein['calories'] * (protein_serving / 100),
        'protein': protein['protein'] * (protein_serving / 100),
        'carbs': protein['carbs'] * (protein_serving / 100),
        'fat': protein['fat'] * (protein_serving / 100)
    }
    
    carb_macros = {
        'calories': carb['calories'] * (carb_serving / 100),
        'protein': carb['protein'] * (carb_serving / 100),
        'carbs': carb['carbs'] * (carb_serving / 100),
        'fat': carb['fat'] * (carb_serving / 100)
    }
    
    veg_macros = {
        'calories': vegetable['calories'] * (veg_serving / 100),
        'protein': vegetable['protein'] * (veg_serving / 100),
        'carbs': vegetable['carbs'] * (veg_serving / 100),
        'fat': vegetable['fat'] * (veg_serving / 100)
    }
    
    # Build meal description
    meal_desc = f"{protein['description']} with {carb['description']} and {vegetable['description']}"
    
    # Sum macros
    total_macros = {
        'calories': protein_macros['calories'] + carb_macros['calories'] + veg_macros['calories'],
        'protein': protein_macros['protein'] + carb_macros['protein'] + veg_macros['protein'],
        'carbs': protein_macros['carbs'] + carb_macros['carbs'] + veg_macros['carbs'],
        'fat': protein_macros['fat'] + carb_macros['fat'] + veg_macros['fat']
    }
    
    # Add fat source if provided (FIXED: check if not None instead of truthiness)
    if fat is not None:
        fat_macros = {
            'calories': fat['calories'] * (fat_serving / 100),
            'protein': fat['protein'] * (fat_serving / 100),
            'carbs': fat['carbs'] * (fat_serving / 100),
            'fat': fat['fat'] * (fat_serving / 100)
        }
        total_macros['calories'] += fat_macros['calories']
        total_macros['protein'] += fat_macros['protein']
        total_macros['carbs'] += fat_macros['carbs']
        total_macros['fat'] += fat_macros['fat']
        
        meal_desc += f" with {fat['description']}"
    
    return {
        'description': meal_desc,
        'calories': round(total_macros['calories'], 1),
        'protein': round(total_macros['protein'], 1),
        'carbs': round(total_macros['carbs'], 1),
        'fat': round(total_macros['fat'], 1)
    }

def generate_synthetic_meals(categories, num_meals=500):
    """Generate synthetic meal combinations"""
    meals = []
    
    proteins = categories['protein']
    carbs = categories['carbs']
    vegetables = categories['vegetables']
    fats = categories['fats']
    
    if not proteins or not carbs or not vegetables:
        raise ValueError("Not enough categorized foods to generate meals!")
    
    print(f"\nGenerating {num_meals} synthetic meals...")
    
    for i in range(num_meals):
        # Randomly select components
        protein = random.choice(proteins)
        carb = random.choice(carbs)
        vegetable = random.choice(vegetables)
        
        # 50% chance to add a fat source
        fat = random.choice(fats) if fats and random.random() > 0.5 else None
        
        meal = create_meal_combination(protein, carb, vegetable, fat)
        meals.append(meal)
        
        if (i + 1) % 100 == 0:
            print(f"  Generated {i + 1} meals...")
    
    return pd.DataFrame(meals)

def save_training_data(df, filename='data/training_data.csv'):
    """Save training data to CSV"""
    df.to_csv(filename, index=False)
    print(f"\n✅ Saved {len(df)} meals to {filename}")
    print(f"\nSample meals:")
    print(df.head(10))
    print(f"\nMacro ranges:")
    print(df.describe())

if __name__ == "__main__":
    print("🍽️ Generating synthetic meal data for training...")
    
    # Load nutrition data
    nutrition_df = load_nutrition_data()
    
    # Categorize foods
    categories = categorize_foods(nutrition_df)
    
    # Generate synthetic meals
    meals_df = generate_synthetic_meals(categories, num_meals=1000)
    
    # Save training data
    save_training_data(meals_df)
    
    print("\n📊 Synthetic meal generation complete!")