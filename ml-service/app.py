from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import numpy as np
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Load all 5 model sets on startup (v2)
print("Loading ML models...")

model_types = ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts']
all_models = {}

for meal_type in model_types:
    print(f"  Loading {meal_type} models...")
    all_models[meal_type] = {
        'calories': joblib.load(f'{meal_type}/models/calories_model.joblib'),
        'protein': joblib.load(f'{meal_type}/models/protein_model.joblib'),
        'carbs': joblib.load(f'{meal_type}/models/carbs_model.joblib'),
        'fat': joblib.load(f'{meal_type}/models/fat_model.joblib'),
        'vectorizer': joblib.load(f'{meal_type}/models/vectorizer.joblib')
    }

print("✅ All models loaded!")

# Optional v3 artifacts (service starts even if these fail)
V3_MODELS_DIR = os.path.join(os.path.dirname(__file__), 'v3', 'models')
v3_models = None

def _load_v3_artifacts():
    global v3_models
    try:
        portion_model = joblib.load(os.path.join(V3_MODELS_DIR, 'portion_model.joblib'))
        vectorizer = joblib.load(os.path.join(V3_MODELS_DIR, 'vectorizer.joblib'))
        with open(os.path.join(V3_MODELS_DIR, 'type_macro_densities.json'), 'r') as f:
            type_macro_densities = json.load(f)
        v3_models = {
            'portion_model': portion_model,
            'vectorizer': vectorizer,
            'type_macro_densities': type_macro_densities,
        }
        # Optional: targets_order from metadata.json
        meta_path = os.path.join(V3_MODELS_DIR, 'metadata.json')
        if os.path.exists(meta_path):
            with open(meta_path, 'r') as f:
                meta = json.load(f)
            v3_models['targets_order'] = meta.get('targets_order', ['g_protein', 'g_carb', 'g_vegetable', 'g_fat'])
        else:
            v3_models['targets_order'] = ['g_protein', 'g_carb', 'g_vegetable', 'g_fat']
        print("✅ V3 artifacts loaded!")
    except Exception as e:
        print(f"⚠️ V3 artifacts not loaded: {e}")
        v3_models = None

_load_v3_artifacts()

def predict_for_meal_type(meal_description, meal_type):
    """Predict macros using the appropriate meal-type-specific model"""
    try:
        models = all_models[meal_type]
        
        # Transform to features
        X = models['vectorizer'].transform([meal_description])
        
        # Predict each macro
        predictions = {
            'calories': round(float(models['calories'].predict(X)[0]), 1),
            'protein': round(float(models['protein'].predict(X)[0]), 1),
            'carbs': round(float(models['carbs'].predict(X)[0]), 1),
            'fat': round(float(models['fat'].predict(X)[0]), 1)
        }
        
        return predictions
    except Exception as e:
        print(f"Error predicting for {meal_type}: {str(e)}")
        return None

@app.route('/', methods=['GET'])
def root():
    endpoints = {
        'health': '/health',
        'predict_breakfast': '/predict-breakfast (POST)',
        'predict_lunch': '/predict-lunch (POST)',
        'predict_dinner': '/predict-dinner (POST)',
        'predict_snacks': '/predict-snacks (POST)',
        'predict_desserts': '/predict-desserts (POST)',
        'predict_auto': '/predict-macros (POST with meal_type)',
        'predict_v3': '/predict-v3 (POST with meal_type + ingredients[])',
    }
    return jsonify({
        'status': 'running',
        'service': 'ML Macro Predictor - Specialized Models',
        'version': '2.0',
        'models': model_types,
        'endpoints': endpoints
    }), 200

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'ML Macro Predictor',
        'models_loaded': len(all_models)
    }), 200

# Specific endpoints for each meal type
@app.route('/predict-breakfast', methods=['POST'])
def predict_breakfast():
    try:
        data = request.get_json()
        if not data or 'meal' not in data:
            return jsonify({'success': False, 'error': 'Missing meal description'}), 400
        
        predictions = predict_for_meal_type(data['meal'], 'breakfast')
        if predictions:
            return jsonify({
                'success': True,
                'meal': data['meal'],
                'meal_type': 'breakfast',
                'predictions': predictions
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Prediction failed'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/predict-lunch', methods=['POST'])
def predict_lunch():
    try:
        data = request.get_json()
        if not data or 'meal' not in data:
            return jsonify({'success': False, 'error': 'Missing meal description'}), 400
        
        predictions = predict_for_meal_type(data['meal'], 'lunch')
        if predictions:
            return jsonify({
                'success': True,
                'meal': data['meal'],
                'meal_type': 'lunch',
                'predictions': predictions
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Prediction failed'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/predict-dinner', methods=['POST'])
def predict_dinner():
    try:
        data = request.get_json()
        if not data or 'meal' not in data:
            return jsonify({'success': False, 'error': 'Missing meal description'}), 400
        
        predictions = predict_for_meal_type(data['meal'], 'dinner')
        if predictions:
            return jsonify({
                'success': True,
                'meal': data['meal'],
                'meal_type': 'dinner',
                'predictions': predictions
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Prediction failed'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/predict-snacks', methods=['POST'])
def predict_snacks():
    try:
        data = request.get_json()
        if not data or 'meal' not in data:
            return jsonify({'success': False, 'error': 'Missing meal description'}), 400
        
        predictions = predict_for_meal_type(data['meal'], 'snacks')
        if predictions:
            return jsonify({
                'success': True,
                'meal': data['meal'],
                'meal_type': 'snacks',
                'predictions': predictions
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Prediction failed'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/predict-desserts', methods=['POST'])
def predict_desserts():
    try:
        data = request.get_json()
        if not data or 'meal' not in data:
            return jsonify({'success': False, 'error': 'Missing meal description'}), 400
        
        predictions = predict_for_meal_type(data['meal'], 'desserts')
        if predictions:
            return jsonify({
                'success': True,
                'meal': data['meal'],
                'meal_type': 'desserts',
                'predictions': predictions
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Prediction failed'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- V3 endpoint ---
VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts']
VALID_INGREDIENT_TYPES = ['protein', 'carb', 'vegetable', 'fat', 'sauce', 'dairy']
TYPE_ORDER = ['protein', 'carb', 'vegetable', 'fat', 'sauce', 'dairy']

def _build_v3_feature_string(meal_type, ingredients):
    """Build stable text feature: MEALTYPE_<type> | type: name1; name2 | ..."""
    by_type = {t: [] for t in TYPE_ORDER}
    for ing in ingredients:
        t = ing.get('type', '').strip().lower()
        name = (ing.get('name') or '').strip().lower()
        if not name or t not in TYPE_ORDER:
            continue
        if name not in by_type[t]:
            by_type[t].append(name)
    parts = [f"MEALTYPE_{meal_type}"]
    for t in TYPE_ORDER:
        names = by_type[t]
        if names:
            parts.append(f"{t}: {'; '.join(names)}")
    return " | ".join(parts)

@app.route('/predict-v3', methods=['POST'])
def predict_v3():
    if v3_models is None:
        return jsonify({
            'success': False,
            'error': 'V3 models not available; artifacts failed to load at startup.'
        }), 503
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({'success': False, 'error': 'Missing JSON body'}), 400

        meal_type = (data.get('meal_type') or '').strip().lower()
        if meal_type not in VALID_MEAL_TYPES:
            return jsonify({
                'success': False,
                'error': f"meal_type must be one of: {VALID_MEAL_TYPES}"
            }), 400

        ingredients = data.get('ingredients')
        if not isinstance(ingredients, list) or len(ingredients) == 0:
            return jsonify({
                'success': False,
                'error': 'ingredients must be a non-empty list'
            }), 400

        for i, ing in enumerate(ingredients):
            if not isinstance(ing, dict):
                return jsonify({'success': False, 'error': f'ingredients[{i}] must be an object with name and type'}), 400
            name = (ing.get('name') or '').strip()
            typ = (ing.get('type') or '').strip().lower()
            if not name:
                return jsonify({'success': False, 'error': f'ingredients[{i}].name must be non-empty'}), 400
            if typ not in VALID_INGREDIENT_TYPES:
                return jsonify({
                    'success': False,
                    'error': f"ingredients[{i}].type must be one of: {VALID_INGREDIENT_TYPES}"
                }), 400

        feature_str = _build_v3_feature_string(meal_type, ingredients)
        X = v3_models['vectorizer'].transform([feature_str])
        raw = v3_models['portion_model'].predict(X)[0]
        # Model trained on log1p(y); invert with expm1 and clamp >= 0
        grams_arr = [max(0.0, float(np.expm1(g))) for g in raw]

        targets_order = v3_models.get('targets_order', ['g_protein', 'g_carb', 'g_vegetable', 'g_fat'])
        idx = {name: i for i, name in enumerate(targets_order)}
        g_protein = grams_arr[idx['g_protein']] if 'g_protein' in idx and idx['g_protein'] < len(grams_arr) else 0.0
        g_carb = grams_arr[idx['g_carb']] if 'g_carb' in idx and idx['g_carb'] < len(grams_arr) else 0.0
        g_vegetable = grams_arr[idx['g_vegetable']] if 'g_vegetable' in idx and idx['g_vegetable'] < len(grams_arr) else 0.0
        g_fat = grams_arr[idx['g_fat']] if 'g_fat' in idx and idx['g_fat'] < len(grams_arr) else 0.0

        # Caps and floors: fat by num_fat; carb for lunch/breakfast; veg floor when veg present
        num_fat = sum(1 for ing in ingredients if isinstance(ing, dict) and (ing.get('type') or '').strip().lower() == 'fat')
        g_fat_cap = 10 + 10 * num_fat  # 0 fats=>10g, 1=>20g, 2=>30g
        g_fat = min(g_fat, g_fat_cap)
        if meal_type in ['lunch', 'breakfast']:
            g_carb = min(g_carb, 260.0)
        has_vegetable = any(isinstance(ing, dict) and (ing.get('type') or '').strip().lower() == 'vegetable' for ing in ingredients)
        if has_vegetable:
            g_vegetable = max(g_vegetable, 60.0)
        if meal_type == 'desserts':
            g_protein = min(g_protein, 60.0)
        g_protein = max(0.0, g_protein)
        g_carb = max(0.0, g_carb)
        g_vegetable = max(0.0, g_vegetable)
        g_fat = max(0.0, g_fat)

        # Temporary: log predicted grams for /predict-v3
        print(f"[predict-v3] predicted grams: g_protein={g_protein:.1f} g_carb={g_carb:.1f} g_vegetable={g_vegetable:.1f} g_fat={g_fat:.1f}")

        densities = v3_models['type_macro_densities']
        P = (
            g_protein * densities['protein']['p_per_g']
            + g_carb * densities['carb']['p_per_g']
            + g_vegetable * densities['vegetable']['p_per_g']
            + g_fat * densities['fat']['p_per_g']
        )
        C = (
            g_protein * densities['protein']['c_per_g']
            + g_carb * densities['carb']['c_per_g']
            + g_vegetable * densities['vegetable']['c_per_g']
            + g_fat * densities['fat']['c_per_g']
        )
        F = (
            g_protein * densities['protein']['f_per_g']
            + g_carb * densities['carb']['f_per_g']
            + g_vegetable * densities['vegetable']['f_per_g']
            + g_fat * densities['fat']['f_per_g']
        )
        calories = 4 * P + 4 * C + 9 * F

        resp = {
            'success': True,
            'meal_type': meal_type,
            'predictions': {
                'protein': round(P, 1),
                'carbs': round(C, 1),
                'fat': round(F, 1),
                'calories': round(calories, 1),
            }
        }
        if data.get('debug') is True:
            # Plain floats, no numpy types or NaN
            def _plain_float(x):
                if x is None or (x != x):  # None or any NaN
                    return 0.0
                return float(round(float(x), 1))
            resp['predicted_grams'] = {
                'protein': _plain_float(g_protein),
                'carb': _plain_float(g_carb),
                'vegetable': _plain_float(g_vegetable),
                'fat': _plain_float(g_fat),
            }
            print('[predict-v3] debug grams returned')
        return jsonify(resp), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Auto-detect endpoint (for backwards compatibility)
@app.route('/predict-macros', methods=['POST'])
def predict_macros():
    try:
        data = request.get_json()
        if not data or 'meal' not in data:
            return jsonify({'success': False, 'error': 'Missing meal description'}), 400
        
        # Get meal type from request, default to 'dinner' if not specified
        meal_type = data.get('meal_type', 'dinner')
        
        if meal_type not in model_types:
            return jsonify({'error': f'Invalid meal_type. Must be one of: {model_types}'}), 400
        
        predictions = predict_for_meal_type(data['meal'], meal_type)
        if predictions:
            return jsonify({
                'success': True,
                'meal': data['meal'],
                'meal_type': meal_type,
                'predictions': predictions
            }), 200
        else:
            return jsonify({'success': False, 'error': 'Prediction failed'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)