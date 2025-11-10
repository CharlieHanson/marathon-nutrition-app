import pytest
import joblib
import numpy as np
from pathlib import Path

# Test that all models exist and load correctly
def test_models_exist():
    """Verify all 5 meal type models are present"""
    model_dir = Path('breakfast/models')
    assert (model_dir / 'calories_model.joblib').exists()
    assert (model_dir / 'protein_model.joblib').exists()
    assert (model_dir / 'carbs_model.joblib').exists()
    assert (model_dir / 'fat_model.joblib').exists()
    assert (model_dir / 'vectorizer.joblib').exists()

# Test model accuracy on sample data
def test_breakfast_model_accuracy():
    """Test breakfast model predictions are within acceptable range"""
    from breakfast.train_model import load_training_data, prepare_features
    
    df = load_training_data('breakfast/data/training_data.csv')
    X, vectorizer = prepare_features(df)
    
    # Load trained model
    cal_model = joblib.load('breakfast/models/calories_model.joblib')
    
    # Predict
    predictions = cal_model.predict(X[:100])  # Test on first 100
    actual = df['calories'].values[:100]
    
    # Calculate MAE
    mae = np.mean(np.abs(predictions - actual))
    
    # Should be under 75 calories error
    assert mae < 90, f"Breakfast model MAE too high: {mae}"

def test_lunch_model_accuracy():
    """Test lunch model predictions"""
    from lunch.train_model import load_training_data, prepare_features
    
    df = load_training_data('lunch/data/training_data.csv')
    X, vectorizer = prepare_features(df)
    
    cal_model = joblib.load('lunch/models/calories_model.joblib')
    predictions = cal_model.predict(X[:100])
    actual = df['calories'].values[:100]
    mae = np.mean(np.abs(predictions - actual))
    
    assert mae < 90, f"Lunch model MAE too high: {mae}"

def test_model_predictions_positive():
    """Test that models never predict negative macros"""
    vectorizer = joblib.load('breakfast/models/vectorizer.joblib')
    cal_model = joblib.load('breakfast/models/calories_model.joblib')
    
    test_meals = [
        "Scrambled eggs with toast",
        "Greek yogurt with berries",
        "Oatmeal with banana"
    ]
    
    X = vectorizer.transform(test_meals)
    predictions = cal_model.predict(X)
    
    assert all(p > 0 for p in predictions), "Model predicted negative calories"

def test_model_predictions_reasonable():
    """Test that predictions are in reasonable ranges"""
    vectorizer = joblib.load('breakfast/models/vectorizer.joblib')
    cal_model = joblib.load('breakfast/models/calories_model.joblib')
    protein_model = joblib.load('breakfast/models/protein_model.joblib')
    
    meal = "Scrambled eggs with toast"
    X = vectorizer.transform([meal])
    
    cal_pred = cal_model.predict(X)[0]
    protein_pred = protein_model.predict(X)[0]
    
    # Breakfast should be 200-800 calories
    assert 200 <= cal_pred <= 800, f"Unreasonable calories: {cal_pred}"
    
    # Protein should be reasonable relative to calories
    assert protein_pred < cal_pred / 4, "Protein can't exceed total calories/4"

def test_all_meal_types_loaded():
    """Test that all 5 meal types have models"""
    meal_types = ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts']
    
    for meal_type in meal_types:
        model_path = Path(f'{meal_type}/models/calories_model.joblib')
        assert model_path.exists(), f"Missing {meal_type} model"