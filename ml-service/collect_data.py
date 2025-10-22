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
    
    # Carbs
    "brown rice", "quinoa", "oatmeal", "sweet potato", "pasta",
    "whole wheat bread", "banana", "apple", "berries", "orange",
    
    # Vegetables
    "broccoli", "spinach", "kale", "carrots", "bell peppers",
    "asparagus", "green beans", "tomatoes", "cucumber", "avocado",
    
    # Fats
    "almonds", "peanut butter", "olive oil", "walnuts", "chia seeds",
    "flax seeds", "cashews",
    
    # Common meals
    "pizza", "burger", "salad", "soup", "sandwich", "burrito",
    "stir fry", "pasta sauce", "hummus", "granola"
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
        return {
            'description': food_item.get('description', ''),
            'calories': nutrients['calories'],
            'protein': nutrients['protein'],
            'carbs': nutrients['carbs'],
            'fat': nutrients['fat']
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