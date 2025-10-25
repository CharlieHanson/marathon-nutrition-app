from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

app = Flask(__name__)
# More permissive CORS for Railway
CORS(app, resources={r"/*": {"origins": "*"}})

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

port = os.environ.get('PORT', 'NOT SET')
print(f"🔍 PORT environment variable: {port}")
print(f"✅ Flask app ready to serve requests")

@app.route('/', methods=['GET'])
def root():
    print("📥 Root endpoint hit!")
    return jsonify({
        'status': 'running',
        'service': 'ML Macro Predictor',
        'version': '1.0',
        'endpoints': {
            'health': '/health',
            'predict': '/predict-macros (POST)'
        }
    }), 200

@app.route('/health', methods=['GET'])
def health():
    print("📥 Health check hit!")
    return jsonify({'status': 'healthy', 'service': 'ML Macro Predictor'}), 200

@app.route('/predict-macros', methods=['POST'])
def predict_macros():
    print("📥 Prediction request received")
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
        
        print(f"✅ Prediction successful for: {meal}")
        
        return jsonify({
            'success': True,
            'meal': meal,
            'predictions': predictions
        }), 200
    
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)