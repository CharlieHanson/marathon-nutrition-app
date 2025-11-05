import pandas as pd
import random

def load_nutrition_data(filename='data/nutrition_data.csv'):
    """Load the USDA nutrition data"""
    df = pd.read_csv(filename)
    print(f"Loaded {len(df)} food items")
    return df

def clean_data(df):
    """Remove implausible foods"""
    def is_plausible(row):
        # Check for negatives
        if any(row[k] < 0 for k in ['calories', 'protein', 'carbs', 'fat']):
            return False
        # Sanity check: macro-derived calories should be close to listed calories
        macro_cal = 4*row['protein'] + 4*row['carbs'] + 9*row['fat']
        listed_cal = row['calories']
        # Allow 25% tolerance
        return (0.75*macro_cal <= listed_cal <= 1.25*macro_cal) or macro_cal == 0
    
    cleaned = df[df.apply(is_plausible, axis=1)]
    print(f"Cleaned: {len(df)} → {len(cleaned)} items")
    return cleaned

def categorize_foods(df):
    """Categorize foods into lunch-specific categories"""
    categories = {
        'protein': [],
        'carbs': [],
        'vegetables': [],
        'fats': []
    }
    
    protein_keywords = ['chicken', 'turkey', 'tuna', 'salmon', 'ham', 'roast beef',
                       'tofu', 'egg', 'chickpea', 'black bean', 'lentil', 'shrimp']
    carb_keywords = ['bread', 'wrap', 'tortilla', 'rice', 'pasta', 'quinoa', 
                    'pita', 'sandwich', 'burger', 'roll', 'noodle', 'chip', 'cracker']
    veg_keywords = ['lettuce', 'tomato', 'cucumber', 'pepper', 'spinach', 'salad',
                   'avocado', 'carrot', 'onion', 'broccoli', 'kale', 'bean']
    fat_keywords = ['dressing', 'mayo', 'hummus', 'cheese', 'oil', 'nut', 'seed',
                   'avocado', 'guacamole', 'butter']
    
    for _, row in df.iterrows():
        desc = row['description'].lower()
        
        if any(kw in desc for kw in protein_keywords):
            categories['protein'].append(row)
        if any(kw in desc for kw in carb_keywords):
            categories['carbs'].append(row)
        if any(kw in desc for kw in veg_keywords):
            categories['vegetables'].append(row)
        if any(kw in desc for kw in fat_keywords):
            categories['fats'].append(row)
    
    print(f"\nCategorized lunch foods:")
    for cat, items in categories.items():
        print(f"  {cat}: {len(items)} items")
    
    return categories

def get_serving_size(food_desc, role):
    """Return smart serving size based on food type"""
    desc = food_desc.lower()
    
    if role == 'protein':
        if any(k in desc for k in ['chicken', 'turkey', 'tuna', 'salmon']): 
            return random.uniform(100, 150)
        if any(k in desc for k in ['egg', 'chickpea', 'bean']): 
            return random.uniform(80, 120)
        if any(k in desc for k in ['ham', 'roast beef']): 
            return random.uniform(60, 100)
        return random.uniform(90, 140)
    
    if role == 'carbs':
        if 'bread' in desc or 'sandwich' in desc: 
            return random.uniform(60, 100)
        if 'wrap' in desc or 'tortilla' in desc: 
            return random.uniform(70, 110)
        if any(k in desc for k in ['rice', 'pasta', 'quinoa', 'noodle']): 
            return random.uniform(120, 180)
        if any(k in desc for k in ['chip', 'cracker']): 
            return random.uniform(30, 50)
        return random.uniform(80, 130)
    
    if role == 'vegetables':
        if 'salad' in desc: 
            return random.uniform(100, 200)
        return random.uniform(60, 120)
    
    if role == 'fats':
        if 'dressing' in desc or 'mayo' in desc: 
            return random.uniform(15, 30)
        if 'cheese' in desc: 
            return random.uniform(20, 40)
        if any(k in desc for k in ['hummus', 'guacamole']): 
            return random.uniform(30, 60)
        return random.uniform(10, 25)
    
    return 100

def create_lunch_meal(protein, carb, vegetable=None, fat=None):
    """Create lunch with smart portions"""
    # Get smart serving sizes
    p_grams = get_serving_size(protein['description'], 'protein')
    c_grams = get_serving_size(carb['description'], 'carbs')
    v_grams = get_serving_size(vegetable['description'], 'vegetables') if vegetable is not None else 0
    f_grams = get_serving_size(fat['description'], 'fats') if fat is not None else 0
    
    # Calculate macros (per 100g)
    p_cal = protein['calories'] * (p_grams / 100)
    p_prot = protein['protein'] * (p_grams / 100)
    p_carb = protein['carbs'] * (p_grams / 100)
    p_fat = protein['fat'] * (p_grams / 100)
    
    c_cal = carb['calories'] * (c_grams / 100)
    c_prot = carb['protein'] * (c_grams / 100)
    c_carb = carb['carbs'] * (c_grams / 100)
    c_fat = carb['fat'] * (c_grams / 100)
    
    # Start with protein + carb
    total_cal = p_cal + c_cal
    total_prot = p_prot + c_prot
    total_carb = p_carb + c_carb
    total_fat = p_fat + c_fat
    
    desc = f"{protein['description']} with {carb['description']}"
    
    # Add vegetable
    if vegetable is not None:
        v_cal = vegetable['calories'] * (v_grams / 100)
        v_prot = vegetable['protein'] * (v_grams / 100)
        v_carb = vegetable['carbs'] * (v_grams / 100)
        v_fat = vegetable['fat'] * (v_grams / 100)
        
        total_cal += v_cal
        total_prot += v_prot
        total_carb += v_carb
        total_fat += v_fat
        desc += f" and {vegetable['description']}"
    
    # Add fat
    if fat is not None:
        f_cal = fat['calories'] * (f_grams / 100)
        f_prot = fat['protein'] * (f_grams / 100)
        f_carb = fat['carbs'] * (f_grams / 100)
        f_fat = fat['fat'] * (f_grams / 100)
        
        total_cal += f_cal
        total_prot += f_prot
        total_carb += f_carb
        total_fat += f_fat
        desc += f" with {fat['description']}"
    
    return {
        'description': desc,
        'calories': round(total_cal, 1),
        'protein': round(total_prot, 1),
        'carbs': round(total_carb, 1),
        'fat': round(total_fat, 1)
    }

def generate_synthetic_lunches(categories, num_meals=1000):
    """Generate synthetic lunch combinations with smart logic"""
    meals = []
    
    proteins = categories['protein']
    carbs = categories['carbs']
    vegetables = categories['vegetables']
    fats = categories['fats']
    
    if not proteins or not carbs:
        raise ValueError("Not enough categorized foods to generate lunches!")
    
    print(f"\nGenerating {num_meals} synthetic lunches...")
    
    attempts = 0
    max_attempts = num_meals * 2
    
    while len(meals) < num_meals and attempts < max_attempts:
        attempts += 1
        
        protein = random.choice(proteins)
        carb = random.choice(carbs)
        
        # Vegetables more likely with salads/wraps
        carb_desc = carb['description'].lower()
        veg_prob = 0.8 if any(k in carb_desc for k in ['salad', 'wrap', 'sandwich']) else 0.6
        vegetable = random.choice(vegetables) if vegetables and random.random() < veg_prob else None
        
        # Fat more likely with salads (dressing), less likely with chips/fries
        fat_prob = 0.7 if 'salad' in carb_desc else (0.3 if any(k in carb_desc for k in ['chip', 'fries']) else 0.5)
        fat = random.choice(fats) if fats and random.random() < fat_prob else None
        
        meal = create_lunch_meal(protein, carb, vegetable, fat)
        
        # Filter: keep 350-750 cal
        if 350 <= meal['calories'] <= 750:
            meals.append(meal)
            
            if len(meals) % 100 == 0:
                print(f"  Generated {len(meals)} meals...")
    
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
    print("🍽️ Generating synthetic lunch data for training...")
    
    nutrition_df = load_nutrition_data()
    nutrition_df = clean_data(nutrition_df)
    categories = categorize_foods(nutrition_df)
    meals_df = generate_synthetic_lunches(categories, num_meals=1000)
    save_training_data(meals_df)
    
    print("\n📊 Synthetic lunch generation complete!")