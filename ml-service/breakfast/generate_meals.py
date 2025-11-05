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
    """Categorize foods into breakfast-specific categories"""
    categories = {
        'protein': [],
        'carbs': [],
        'fruits': [],
        'fats': []
    }
    
    protein_keywords = ['egg', 'yogurt', 'cottage cheese', 'ricotta', 'bacon', 
                       'sausage', 'turkey bacon', 'ham', 'salmon', 'protein']
    carb_keywords = ['oat', 'pancake', 'waffle', 'toast', 'bread', 'bagel', 'muffin',
                    'cereal', 'granola', 'english muffin', 'croissant', 'biscuit',
                    'french toast', 'hash brown', 'burrito']
    fruit_keywords = ['berry', 'banana', 'apple', 'orange', 'strawberry', 
                     'blueberry', 'raspberry', 'melon', 'grapefruit', 'peach', 'pear']
    fat_keywords = ['peanut butter', 'almond butter', 'avocado', 'butter', 
                   'cream cheese', 'almond', 'walnut', 'nut', 'seed']
    
    for _, row in df.iterrows():
        desc = row['description'].lower()
        
        if any(kw in desc for kw in protein_keywords):
            categories['protein'].append(row)
        if any(kw in desc for kw in carb_keywords):
            categories['carbs'].append(row)
        if any(kw in desc for kw in fruit_keywords):
            categories['fruits'].append(row)
        if any(kw in desc for kw in fat_keywords):
            categories['fats'].append(row)
    
    print(f"\nCategorized breakfast foods:")
    for cat, items in categories.items():
        print(f"  {cat}: {len(items)} items")
    
    return categories

def get_serving_size(food_desc, role):
    """Return smart serving size based on food type"""
    desc = food_desc.lower()
    
    if role == 'protein':
        if 'egg' in desc: return random.uniform(80, 140)
        if 'yogurt' in desc: return random.uniform(180, 250)
        if any(k in desc for k in ['bacon', 'sausage', 'ham']): return random.uniform(40, 80)
        return random.uniform(100, 180)
    
    if role == 'carbs':
        if any(k in desc for k in ['oat', 'oatmeal']): return random.uniform(40, 60)
        if 'cereal' in desc or 'granola' in desc: return random.uniform(30, 50)
        if any(k in desc for k in ['toast', 'bread']): return random.uniform(30, 70)
        if any(k in desc for k in ['pancake', 'waffle']): return random.uniform(70, 130)
        if 'bagel' in desc: return random.uniform(70, 110)
        return random.uniform(50, 90)
    
    if role == 'fruits':
        return random.uniform(80, 150)
    
    if role == 'fats':
        if 'butter' in desc: return random.uniform(15, 30)
        if 'avocado' in desc: return random.uniform(50, 80)
        return random.uniform(15, 30)
    
    return 100

def create_breakfast_meal(protein, carb, fruit=None, fat=None):
    """Create breakfast with smart portions"""
    # Get smart serving sizes
    p_grams = get_serving_size(protein['description'], 'protein')
    c_grams = get_serving_size(carb['description'], 'carbs')
    f_grams = get_serving_size(fruit['description'], 'fruits') if fruit is not None else 0
    t_grams = get_serving_size(fat['description'], 'fats') if fat is not None else 0
    
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
    
    # Add fruit
    if fruit is not None:
        fr_cal = fruit['calories'] * (f_grams / 100)
        fr_prot = fruit['protein'] * (f_grams / 100)
        fr_carb = fruit['carbs'] * (f_grams / 100)
        fr_fat = fruit['fat'] * (f_grams / 100)
        
        total_cal += fr_cal
        total_prot += fr_prot
        total_carb += fr_carb
        total_fat += fr_fat
        desc += f" and {fruit['description']}"
    
    # Add fat
    if fat is not None:
        t_cal = fat['calories'] * (t_grams / 100)
        t_prot = fat['protein'] * (t_grams / 100)
        t_carb = fat['carbs'] * (t_grams / 100)
        t_fat = fat['fat'] * (t_grams / 100)
        
        total_cal += t_cal
        total_prot += t_prot
        total_carb += t_carb
        total_fat += t_fat
        desc += f" with {fat['description']}"
    
    return {
        'description': desc,
        'calories': round(total_cal, 1),
        'protein': round(total_prot, 1),
        'carbs': round(total_carb, 1),
        'fat': round(total_fat, 1)
    }

def generate_synthetic_breakfasts(categories, num_meals=1000):
    """Generate synthetic breakfast combinations with smart logic"""
    meals = []
    
    proteins = categories['protein']
    carbs = categories['carbs']
    fruits = categories['fruits']
    fats = categories['fats']
    
    if not proteins or not carbs:
        raise ValueError("Not enough categorized foods to generate breakfasts!")
    
    print(f"\nGenerating {num_meals} synthetic breakfasts...")
    
    attempts = 0
    max_attempts = num_meals * 2
    
    while len(meals) < num_meals and attempts < max_attempts:
        attempts += 1
        
        protein = random.choice(proteins)
        carb = random.choice(carbs)
        
        # Fruit more likely with oats/cereal
        carb_desc = carb['description'].lower()
        fruit_prob = 0.7 if any(k in carb_desc for k in ['oat', 'cereal', 'granola']) else 0.5
        fruit = random.choice(fruits) if fruits and random.random() < fruit_prob else None
        
        # Fat less likely with high-fat carbs
        fat_prob = 0.3 if any(k in carb_desc for k in ['croissant', 'biscuit']) else 0.45
        fat = random.choice(fats) if fats and random.random() < fat_prob else None
        
        meal = create_breakfast_meal(protein, carb, fruit, fat)
        
        # Filter: keep 300-700 cal
        if 300 <= meal['calories'] <= 700:
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
    print("🍽️ Generating synthetic breakfast data for training...")
    
    nutrition_df = load_nutrition_data()
    nutrition_df = clean_data(nutrition_df)
    categories = categorize_foods(nutrition_df)
    meals_df = generate_synthetic_breakfasts(categories, num_meals=1000)
    save_training_data(meals_df)
    
    print("\n📊 Synthetic breakfast generation complete!")