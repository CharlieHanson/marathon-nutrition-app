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
    """Categorize foods into dessert-specific categories"""
    categories = {
        'sweets': [],      # Ice cream, cake, cookies, candy
        'fruits': [],      # Fruit-based desserts
        'healthy': []      # Yogurt parfait, protein treats
    }
    
    sweet_keywords = ['ice cream', 'cake', 'cookie', 'brownie', 'pie', 'donut',
                     'candy', 'chocolate', 'fudge', 'pudding', 'custard',
                     'cheesecake', 'cupcake', 'pastry', 'tart', 'eclair',
                     'mousse', 'gelato', 'sorbet', 'sherbet', 'frozen yogurt']
    fruit_keywords = ['fruit', 'berry', 'apple', 'banana', 'strawberry', 
                     'blueberry', 'mango', 'peach', 'pineapple', 'orange']
    healthy_keywords = ['yogurt', 'parfait', 'protein', 'greek yogurt', 'smoothie']
    
    for _, row in df.iterrows():
        desc = row['description'].lower()
        
        if any(kw in desc for kw in sweet_keywords):
            categories['sweets'].append(row)
        if any(kw in desc for kw in fruit_keywords):
            categories['fruits'].append(row)
        if any(kw in desc for kw in healthy_keywords):
            categories['healthy'].append(row)
    
    print(f"\nCategorized dessert foods:")
    for cat, items in categories.items():
        print(f"  {cat}: {len(items)} items")
    
    return categories

def get_serving_size(food_desc, category):
    """Return dessert-appropriate serving size"""
    desc = food_desc.lower()
    
    if category == 'sweets':
        if 'ice cream' in desc or 'gelato' in desc: 
            return random.uniform(80, 150)  # ~1 cup
        if any(k in desc for k in ['cookie', 'brownie']): 
            return random.uniform(40, 80)   # 1-2 cookies
        if any(k in desc for k in ['cake', 'pie']): 
            return random.uniform(80, 120)  # slice
        if 'candy' in desc or 'chocolate' in desc: 
            return random.uniform(30, 60)   # small portion
        return random.uniform(60, 100)
    
    if category == 'fruits':
        return random.uniform(100, 200)  # fruit portion
    
    if category == 'healthy':
        return random.uniform(150, 250)  # parfait/smoothie
    
    return 100

def create_dessert(primary, secondary=None):
    """Create dessert - can be single item or combo"""
    # Get serving size based on what it is
    if 'sweets' in primary:
        p_grams = get_serving_size(primary['food']['description'], 'sweets')
    elif 'fruits' in primary:
        p_grams = get_serving_size(primary['food']['description'], 'fruits')
    else:
        p_grams = get_serving_size(primary['food']['description'], 'healthy')
    
    food = primary['food']
    
    # Calculate macros
    total_cal = food['calories'] * (p_grams / 100)
    total_prot = food['protein'] * (p_grams / 100)
    total_carb = food['carbs'] * (p_grams / 100)
    total_fat = food['fat'] * (p_grams / 100)
    
    desc = food['description']
    
    # Add secondary (like fruit with ice cream, or toppings)
    if secondary is not None:
        s_food = secondary['food']
        if 'fruits' in secondary:
            s_grams = get_serving_size(s_food['description'], 'fruits')
        else:
            s_grams = random.uniform(20, 50)  # smaller topping
        
        s_cal = s_food['calories'] * (s_grams / 100)
        s_prot = s_food['protein'] * (s_grams / 100)
        s_carb = s_food['carbs'] * (s_grams / 100)
        s_fat = s_food['fat'] * (s_grams / 100)
        
        total_cal += s_cal
        total_prot += s_prot
        total_carb += s_carb
        total_fat += s_fat
        desc += f" with {s_food['description']}"
    
    return {
        'description': desc,
        'calories': round(total_cal, 1),
        'protein': round(total_prot, 1),
        'carbs': round(total_carb, 1),
        'fat': round(total_fat, 1)
    }

def generate_synthetic_desserts(categories, num_desserts=1000):
    """Generate realistic dessert combinations"""
    desserts = []
    
    sweets = categories['sweets']
    fruits = categories['fruits']
    healthy = categories['healthy']
    
    all_items = []
    for cat_name, items in categories.items():
        for item in items:
            all_items.append({'category': cat_name, 'food': item})
    
    if len(all_items) < 10:
        raise ValueError("Not enough dessert foods!")
    
    print(f"\nGenerating {num_desserts} synthetic desserts...")
    
    attempts = 0
    max_attempts = num_desserts * 2
    
    while len(desserts) < num_desserts and attempts < max_attempts:
        attempts += 1
        
        # 70% single item, 30% combo
        is_single = random.random() < 0.7
        
        primary = random.choice(all_items)
        
        if is_single:
            secondary = None
        else:
            # Combo: ice cream + fruit, cake + ice cream, etc.
            secondary = random.choice(all_items)
            # Don't combo the same item
            if secondary['food']['description'] == primary['food']['description']:
                secondary = None
        
        dessert = create_dessert(primary, secondary)
        
        # Filter: 100-600 cal (desserts vary widely)
        if 100 <= dessert['calories'] <= 600:
            desserts.append(dessert)
            
            if len(desserts) % 100 == 0:
                print(f"  Generated {len(desserts)} desserts...")
    
    return pd.DataFrame(desserts)

def save_training_data(df, filename='data/training_data.csv'):
    """Save training data to CSV"""
    df.to_csv(filename, index=False)
    print(f"\n✅ Saved {len(df)} desserts to {filename}")
    print(f"\nSample desserts:")
    print(df.head(10))
    print(f"\nMacro ranges:")
    print(df.describe())

if __name__ == "__main__":
    print("🍽️ Generating synthetic dessert data for training...")
    
    nutrition_df = load_nutrition_data()
    nutrition_df = clean_data(nutrition_df)
    categories = categorize_foods(nutrition_df)
    desserts_df = generate_synthetic_desserts(categories, num_desserts=1000)
    save_training_data(desserts_df)
    
    print("\n📊 Synthetic dessert generation complete!")