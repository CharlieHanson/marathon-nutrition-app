import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os

def load_training_data(filename='data/training_data.csv'):
    """Load the synthetic meal data"""
    df = pd.read_csv(filename)
    print(f"Loaded {len(df)} training examples")
    return df

def prepare_features(df):
    """Convert meal descriptions to numerical features using TF-IDF"""
    print("\nConverting meal descriptions to numerical features...")
    
    # Use TF-IDF to convert text to numbers
    vectorizer = TfidfVectorizer(
        max_features=200,  # Use top 200 words
        ngram_range=(1, 2),  # Use single words and pairs
        lowercase=True,
        stop_words='english'
    )
    
    # Fit and transform descriptions
    X = vectorizer.fit_transform(df['description'])
    
    print(f"Created {X.shape[1]} features from meal descriptions")
    
    return X, vectorizer

def train_models(X, y, target_name):
    """Train multiple models and pick the best one"""
    
    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"\nTraining models for {target_name}...")
    print(f"  Training set: {X_train.shape[0]} samples")
    print(f"  Test set: {X_test.shape[0]} samples")
    
    # Try two different models
    models = {
        'RandomForest': RandomForestRegressor(
            n_estimators=100,
            max_depth=20,
            random_state=42,
            n_jobs=-1
        ),
        'GradientBoosting': GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
    }
    
    best_model = None
    best_score = float('inf')
    best_name = None
    
    for name, model in models.items():
        print(f"\n  Training {name}...")
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)
        
        print(f"    MAE: {mae:.2f}")
        print(f"    RMSE: {rmse:.2f}")
        print(f"    R²: {r2:.3f}")
        
        if mae < best_score:
            best_score = mae
            best_model = model
            best_name = name
    
    print(f"\n  ✅ Best model: {best_name} (MAE: {best_score:.2f})")
    
    return best_model, best_score

def evaluate_model(model, X, y_true, target_name):
    """Detailed evaluation of the model"""
    y_pred = model.predict(X)
    
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    
    # Calculate percentage error
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    
    print(f"\n{target_name} Model Performance:")
    print(f"  Mean Absolute Error: {mae:.2f}")
    print(f"  Root Mean Squared Error: {rmse:.2f}")
    print(f"  R² Score: {r2:.3f}")
    print(f"  Mean Absolute Percentage Error: {mape:.1f}%")
    
    return {
        'mae': mae,
        'rmse': rmse,
        'r2': r2,
        'mape': mape
    }

def save_models(models, vectorizer, output_dir='models'):
    """Save trained models and vectorizer"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Save each model
    for name, model in models.items():
        filename = f"{output_dir}/{name}_model.joblib"
        joblib.dump(model, filename)
        print(f"  Saved {name} model to {filename}")
    
    # Save vectorizer
    vectorizer_file = f"{output_dir}/vectorizer.joblib"
    joblib.dump(vectorizer, vectorizer_file)
    print(f"  Saved vectorizer to {vectorizer_file}")

def test_predictions(models, vectorizer, test_meals):
    """Test the models on sample meals"""
    print("\n" + "="*60)
    print("Testing Model Predictions")
    print("="*60)
    
    for meal_desc, expected in test_meals:
        # Convert description to features
        X_test = vectorizer.transform([meal_desc])
        
        print(f"\nMeal: {meal_desc}")
        print(f"Expected macros: {expected}")
        print("Predicted macros:")
        
        for name, model in models.items():
            pred = model.predict(X_test)[0]
            print(f"  {name}: {pred:.1f}")

if __name__ == "__main__":
    print("🤖 Training Macro Prediction Models")
    print("="*60)
    
    # Load data
    df = load_training_data()
    
    # Prepare features
    X, vectorizer = prepare_features(df)
    
    # Train separate models for each macro
    models = {}
    metrics = {}
    
    for target in ['calories', 'protein', 'carbs', 'fat']:
        y = df[target].values
        model, score = train_models(X, y, target)
        models[target] = model
        
        # Full evaluation on all data
        metrics[target] = evaluate_model(model, X, y, target)
    
    # Save models
    print("\n" + "="*60)
    print("Saving Models")
    print("="*60)
    save_models(models, vectorizer)
    
    # Test on sample meals
    test_meals = [
        ("Grilled chicken breast with brown rice and broccoli", 
         "Cal: ~520, P: ~45g, C: ~58g, F: ~8g"),
        ("Salmon with quinoa and asparagus", 
         "Cal: ~480, P: ~35g, C: ~40g, F: ~16g"),
        ("Turkey burger on whole wheat bun with sweet potato fries", 
         "Cal: ~550, P: ~30g, C: ~65g, F: ~15g")
    ]
    
    test_predictions(models, vectorizer, test_meals)
    
    print("\n" + "="*60)
    print("✅ Model Training Complete!")
    print("="*60)
    print("\nSummary:")
    for target, metric in metrics.items():
        print(f"  {target.capitalize()}: MAE={metric['mae']:.2f}, Accuracy={100-metric['mape']:.1f}%")
    
    print("\nModels saved to 'models/' directory")
    print("Ready to deploy! 🚀")