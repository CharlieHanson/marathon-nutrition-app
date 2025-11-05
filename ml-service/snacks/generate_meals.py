import pandas as pd
import random
from itertools import combinations

def load_nutrition_data(filename='data/nutrition_data.csv'):
    """Load the USDA nutrition data"""
    df = pd.read_csv(filename)
    print(f"Loaded {len(df)} food items")
    return df

def categorize_foods(df):
    """Categorize foods into simple snack categories"""
    categories = {
        'fruits': [],
        'nuts': [],
        'yogurt': [],
        'bars': [],
        'other': []
    }
    
    # Keywords to identify snack categories
    fruit_keywords = ['apple', 'banana', 'orange', 'pear', 'peach', 'plum', 
                     'grape', 'strawberry', 'blueberry', 'raspberry', 
                     'blackberry', 'mango', 'berry']
    nut_keywords = ['almond', 'peanut', 'walnut', 'cashew', 'pistachio',
                   'macadamia', 'pecan', 'nut', 'seed']
    yogurt_keywords = ['yogurt', 'parfait']
    bar_keywords = ['bar', 'protein bar', 'granola bar', 'energy bar']
    
    for _, row in df.iterrows():
        desc = row['description'].lower()
        
        # Categorize based on keywords
        if any(keyword in desc for keyword in fruit_keywords):
            categories['fruits'].append(row)
        elif any(keyword in desc for keyword in nut_keywords):
            categories['nuts'].append(row)
        elif any(keyword in desc for keyword in yogurt_keywords):
            categories['yogurt'].append(row)
        elif any(keyword in desc for keyword in bar_keywords):
            categories['bars'].append(row)
        else:
            categories['other'].append(row)
    
    print(f"\nCategorized snacks:")
    for cat, items in categories.items():
        print(f"  {cat}: {len(items)} items")
    
    return categories

def create_snack(items, portions):
    """Create a snack from 1-2 items with appropriate portions"""
    
    total_macros = {
        'calories': 0,
        'protein': 0,
        'carbs': 0,
        'fat': 0
    }
    
    descriptions = []
    
    for item, portion in zip(items, portions):
        # Calculate macros (USDA data is per 100g)
        descriptions.append(item['description'])
        total_macros['calories'] += item['calories'] * (portion / 100)
        total_macros['protein'] += item['protein'] * (portion / 100)
        total_macros['carbs'] += item['carbs'] * (portion / 100)
        total_macros['fat'] += item['fat'] * (portion / 100)
    
    # Create description
    if len(items) == 1:
        meal_desc = descriptions[0]
    else:
        meal_desc = f"{descriptions[0]} with {descriptions[1]}"
    
    return {
        'description': meal_desc,
        'calories': round(total_macros['calories'], 1),
        'protein': round(total_macros['protein'], 1),
        'carbs': round(total_macros['carbs'], 1),
        'fat': round(total_macros['fat'], 1)
    }

def generate_synthetic_snacks(categories, num_snacks=1000):
    """Generate realistic snack combinations"""
    snacks = []
    
    # Flatten all categories into snack options
    all_snacks = []
    for cat, items in categories.items():
        all_snacks.extend(items)
    
    if len(all_snacks) < 5:
        raise ValueError("Not enough snack foods to generate combinations!")
    
    print(f"\nGenerating {num_snacks} synthetic snacks...")
    
    attempts = 0
    max_attempts = num_snacks * 3  # Try 3x to handle filtering
    
    while len(snacks) < num_snacks and attempts < max_attempts:
        attempts += 1
        
        # Decide: single item (70%) or combo (30%)
        is_single = random.random() < 0.7
        
        if is_single:
            # Single item snack
            item = random.choice(all_snacks)
            # Small to medium portion (30-120g)
            portion = random.uniform(30, 120)
            
            snack = create_snack([item], [portion])
        else:
            # Two-item combo (fruit + nut butter, crackers + cheese, etc.)
            item1 = random.choice(all_snacks)
            item2 = random.choice(all_snacks)
            
            # Make sure they're different
            if item1['description'] == item2['description']:
                continue
            
            # Smaller portions for combos
            portion1 = random.uniform(40, 80)
            portion2 = random.uniform(20, 50)
            
            snack = create_snack([item1, item2], [portion1, portion2])
        
        # Filter: snacks should be 50-400 calories
        if 50 <= snack['calories'] <= 400:
            snacks.append(snack)
            
            if len(snacks) % 100 == 0:
                print(f"  Generated {len(snacks)} snacks...")
    
    if len(snacks) < num_snacks:
        print(f"⚠️  Only generated {len(snacks)} valid snacks (wanted {num_snacks})")
    
    return pd.DataFrame(snacks)

def filter_realistic_snacks(df):
    """Remove non-snack foods from training data"""
    # Keywords that indicate full meals (not snacks)
    meal_keywords = ['platter', 'burgundy', 'stir fry', 'casserole', 
                    'grilled chicken breast', 'baked salmon', 'roast',
                    'fried chicken', 'chicken tenderloin', 'pot roast',
                    'pasta dish', 'dinner', 'entree']
    
    def is_valid_snack(description):
        desc_lower = description.lower()
        # Reject if it contains meal keywords
        if any(keyword in desc_lower for keyword in meal_keywords):
            return False
        return True
    
    original_count = len(df)
    filtered = df[df['description'].apply(is_valid_snack)]
    removed = original_count - len(filtered)
    
    print(f"\n🔍 Filtered out {removed} non-snack items")
    print(f"✅ Kept {len(filtered)} realistic snacks")
    
    return filtered

def save_training_data(df, filename='data/training_data.csv'):
    """Save training data to CSV"""
    df.to_csv(filename, index=False)
    print(f"\n✅ Saved {len(df)} snacks to {filename}")
    print(f"\nSample snacks:")
    print(df.head(10))
    print(f"\nMacro ranges:")
    print(df.describe())

if __name__ == "__main__":
    print("🍽️ Generating synthetic snack data for training...")
    
    # Load nutrition data
    nutrition_df = load_nutrition_data()
    
    # Categorize foods
    categories = categorize_foods(nutrition_df)
    
    # Generate synthetic snacks (generate extra to account for filtering)
    snacks_df = generate_synthetic_snacks(categories, num_snacks=1200)
    
    # Filter out non-snacks
    snacks_df = filter_realistic_snacks(snacks_df)
    
    # Keep only 1000 after filtering
    snacks_df = snacks_df.head(1000)
    
    # Save training data
    save_training_data(snacks_df)
    
    print("\n📊 Synthetic snack generation complete!")