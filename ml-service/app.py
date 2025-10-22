from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

app = Flask(__name__)
CORS(app)

# Load models on startup
print("Loading ML models...")
models = {
    'calories': joblib.load('models/calories_model.joblib'),
    'protein': joblib.load('models/protein_model.joblib'),
    'carbs': joblib.load('models/carbs_model.joblib'),
    'fat': joblib.load('models/fat_model.joblib')
}
vectorizer = joblib.load('models/vectorizer.joblib')
print("✅ Models loaded!")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'ML Macro Predictor'})

@app.route('/predict-macros', methods=['POST'])
def predict_macros():
    try:
        data = request.get_json()
        
        if not data or 'meal' not in data:
            return jsonify({'error': 'Missing meal description'}), 400
        
        meal = data['meal']
        
        # Transform to features
        X = vectorizer.transform([meal])
        
        # Predict
        predictions = {
            'calories': round(float(models['calories'].predict(X)[0]), 1),
            'protein': round(float(models['protein'].predict(X)[0]), 1),
            'carbs': round(float(models['carbs'].predict(X)[0]), 1),
            'fat': round(float(models['fat'].predict(X)[0]), 1)
        }
        
        return jsonify({
            'success': True,
            'meal': meal,
            'predictions': predictions
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)