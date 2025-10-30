import requests
import pandas as pd
import time
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('../.env.local')

# Get API key from environment
API_KEY = os.getenv('USDA_API_KEY')

if not API_KEY:
    raise ValueError("⚠️ USDA_API_KEY not found in .env.local file!")

BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# Common foods athletes eat
SEARCH_TERMS = [
    # Proteins
    "chicken breast", "salmon", "tuna", "turkey", "lean beef", "eggs",
    "greek yogurt", "cottage cheese", "protein powder", "tofu",
    "shrimp", "cod", "tilapia", "pork loin", "lamb",
    "chicken thighs", "ground turkey", "protein bar", "tempeh", "edamame",
    
    # Carbs
    "brown rice", "quinoa", "oatmeal", "sweet potato", "pasta",
    "whole wheat bread", "banana", "apple", "berries", "orange",
    "white rice", "couscous", "bagel", "tortilla", "pita bread",
    "rice cakes", "crackers", "cereal", "mango", "grapes", "toast",
    "rice noodles", "whole grain", "buckwheat", "farro", "barley",
    "dates", "raisins", "peach", "pear", "pineapple", "watermelon",
    
    # Vegetables
    "broccoli", "spinach", "kale", "carrots", "bell peppers",
    "asparagus", "green beans", "tomatoes", "cucumber", "avocado",
    "zucchini", "cauliflower", "brussels sprouts", "lettuce", "mushrooms",
    "onion", "celery", "eggplant",
    "sweet corn", "peas", "beets", "squash", "arugula", "bok choy",
    
    # Fats
    "almonds", "peanut butter", "olive oil", "walnuts", "chia seeds",
    "flax seeds", "cashews", "pecans", "coconut oil", "butter",
    "cream cheese", "sour cream", "cheese",
    "almond butter", "sunflower seeds", "pumpkin seeds", "tahini",
    "hemp seeds", "macadamia nuts", "pistachios",
    
    # Dairy/Alternatives
    "yogurt", "milk", "almond milk", "oat milk", "coconut milk",
    "mozzarella", "cheddar cheese", "parmesan", "feta cheese",
    
    # Common meals/ingredients
    "pizza", "burger", "salad", "soup", "sandwich", "burrito",
    "stir fry", "pasta sauce", "hummus", "granola",
    "honey", "maple syrup", "salad dressing",
    "soy sauce", "marinara sauce", "pesto", "guacamole", "salsa",
    "rice bowl", "wrap", "taco", "quesadilla",
    
    # Desserts
    "dark chocolate", "chocolate", "whipped cream", "ice cream",
    "frozen yogurt", "protein shake", "smoothie", "fruit salad",
    "energy balls", "protein balls", "greek yogurt parfait",
    "chia pudding", "sorbet", "gelato", "pudding",
    "brownie", "cookie", "muffin", "cake"
]

def search_food(term, api_key):
    """Search for a food and return nutrition data"""
    url = f"{BASE_URL}/foods/search"
    params = {
        'api_key': api_key,
        'query': term,
        'pageSize': 5,  # Get top 5 results per term
        'dataType': ['Survey (FNDDS)', 'Foundation', 'SR Legacy']  # Most reliable data
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error searching for {term}: {e}")
        return None

def extract_nutrition(food_item):
    """Extract calories, protein, carbs, fat from food item"""
    nutrients = {}
    
    if 'foodNutrients' not in food_item:
        return None
    
    # Map USDA nutrient IDs to our names
    nutrient_map = {
        'Energy': 'calories',
        'Protein': 'protein',
        'Carbohydrate, by difference': 'carbs',
        'Total lipid (fat)': 'fat'
    }
    
    for nutrient in food_item['foodNutrients']:
        nutrient_name = nutrient.get('nutrientName', '')
        if nutrient_name in nutrient_map:
            value = nutrient.get('value', 0)
            nutrients[nutrient_map[nutrient_name]] = value
    
    # Only return if we have all 4 macros
    if len(nutrients) == 4:
        cal = nutrients['calories']
        prot = nutrients['protein']
        carbs = nutrients['carbs']
        fat = nutrients['fat']
        
        # DATA QUALITY FILTERS:
        # Skip pure oils (>800 cal with essentially 0 protein/carbs)
        if cal > 800 and prot < 1 and carbs < 1:
            return None
        
        # Skip extreme outliers (unrealistic per 100g serving)
        if cal > 1000 or prot > 80 or carbs > 150 or fat > 80:
            return None
        
        # Skip if description contains "oil" (catches olive oil, fish oil, etc.)
        desc = food_item.get('description', '').lower()
        if 'oil' in desc and cal > 500:
            return None
        
        return {
            'description': food_item.get('description', ''),
            'calories': cal,
            'protein': prot,
            'carbs': carbs,
            'fat': fat
        }
    
    return None

def collect_nutrition_data(api_key, search_terms):
    """Collect nutrition data for all search terms"""
    all_foods = []
    
    for term in search_terms:
        print(f"Searching for: {term}")
        results = search_food(term, api_key)
        
        if results and 'foods' in results:
            for food in results['foods']:
                nutrition = extract_nutrition(food)
                if nutrition:
                    all_foods.append(nutrition)
        
        # Be nice to the API - wait between requests
        time.sleep(0.5)
    
    return all_foods

def save_data(foods, filename='data/nutrition_data.csv'):
    """Save collected data to CSV"""
    df = pd.DataFrame(foods)
    
    # Remove duplicates based on description
    df = df.drop_duplicates(subset=['description'])
    
    # Save to CSV
    df.to_csv(filename, index=False)
    print(f"\n✅ Saved {len(df)} foods to {filename}")
    print(f"\nSample data:")
    print(df.head())
    
    return df

if __name__ == "__main__":
    print("🔍 Collecting nutrition data from USDA database...")
    
    # Collect data
    foods = collect_nutrition_data(API_KEY, SEARCH_TERMS)
    
    # Save to CSV
    df = save_data(foods)
    
    print(f"\n📊 Data collection complete!")
    print(f"Total foods collected: {len(df)}")