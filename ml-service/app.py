from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Load all 5 model sets on startup
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
    return jsonify({
        'status': 'running',
        'service': 'ML Macro Predictor - Specialized Models',
        'version': '2.0',
        'models': model_types,
        'endpoints': {
            'health': '/health',
            'predict_breakfast': '/predict-breakfast (POST)',
            'predict_lunch': '/predict-lunch (POST)',
            'predict_dinner': '/predict-dinner (POST)',
            'predict_snacks': '/predict-snacks (POST)',
            'predict_desserts': '/predict-desserts (POST)',
            'predict_auto': '/predict-macros (POST with meal_type)'
        }
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