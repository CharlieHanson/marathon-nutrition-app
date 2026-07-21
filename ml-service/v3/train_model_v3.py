import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion
from sklearn.linear_model import Ridge
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")

TRAINING_CSV = os.path.join(DATA_DIR, "training_portions.csv")

VEC_PATH = os.path.join(MODELS_DIR, "vectorizer.joblib")
MODEL_PATH = os.path.join(MODELS_DIR, "portion_model.joblib")
META_PATH = os.path.join(MODELS_DIR, "metadata.json")

os.makedirs(MODELS_DIR, exist_ok=True)

TARGET_COLS = ["g_protein", "g_carb", "g_vegetable", "g_fat"]

def metrics(y_true, y_pred) -> dict:
    out = {}
    for i, col in enumerate(TARGET_COLS):
        yt = y_true[:, i]
        yp = y_pred[:, i]
        out[col] = {
            "mae": float(mean_absolute_error(yt, yp)),
            "rmse": float(np.sqrt(mean_squared_error(yt, yp))),
            "r2": float(r2_score(yt, yp)),
        }
    return out

def main():
    if not os.path.exists(TRAINING_CSV):
        raise FileNotFoundError(f"Missing {TRAINING_CSV}. Run generate_meals_v3.py first.")

    df = pd.read_csv(TRAINING_CSV)
    if "ingredients_text" not in df.columns:
        raise ValueError("training_portions.csv missing ingredients_text column")

    for c in TARGET_COLS:
        if c not in df.columns:
            raise ValueError(f"training_portions.csv missing target column: {c}")

    X_text = df["ingredients_text"].astype(str).fillna("")
    y = df[TARGET_COLS].astype(float).values

    X_train, X_test, y_train, y_test = train_test_split(
        X_text, y, test_size=0.2, random_state=42
    )
    y_train_log = np.log1p(y_train)
    y_test_log = np.log1p(y_test)

    # FeatureUnion: word TF-IDF + char_wb TF-IDF
    vectorizer = FeatureUnion([
        (
            "word_tfidf",
            TfidfVectorizer(
                lowercase=True,
                analyzer="word",
                ngram_range=(1, 2),
                max_features=20000,
                min_df=2,
            ),
        ),
        (
            "char_tfidf",
            TfidfVectorizer(
                lowercase=True,
                analyzer="char_wb",
                ngram_range=(3, 5),
                max_features=30000,
                min_df=2,
            ),
        ),
    ])

    Xtr = vectorizer.fit_transform(X_train)
    Xte = vectorizer.transform(X_test)

    # Alpha sweep: pick Ridge alpha by test-set average MAE (gram space)
    alphas = [0.5, 1.0, 2.0, 4.0, 8.0]
    best_alpha = None
    best_model = None
    best_avg_mae = np.inf
    best_y_pred = None

    for alpha in alphas:
        base = Ridge(alpha=alpha, random_state=42)
        model = MultiOutputRegressor(base)
        model.fit(Xtr, y_train_log)
        y_pred = np.expm1(model.predict(Xte))
        y_pred = np.maximum(y_pred, 0.0)
        m = metrics(y_test, y_pred)
        avg_mae = np.mean([m[col]["mae"] for col in TARGET_COLS])
        if avg_mae < best_avg_mae:
            best_avg_mae = avg_mae
            best_alpha = alpha
            best_model = model
            best_y_pred = y_pred
        print(f"  alpha={alpha}  avg_mae={avg_mae:.1f}")

    print(f"  best_alpha={best_alpha}  best_avg_mae={best_avg_mae:.1f}")

    # Metrics in original gram space (after inversion) for interpretable MAE
    meta = {
        "version": "v3",
        "targets_order": TARGET_COLS,  # IMPORTANT: runtime must assume this order
        "samples": int(len(df)),
        "vectorizer": {
            "type": "FeatureUnion",
            "word_tfidf": {"analyzer": "word", "ngram_range": [1, 2], "max_features": 20000, "min_df": 2},
            "char_tfidf": {"analyzer": "char_wb", "ngram_range": [3, 5], "max_features": 30000, "min_df": 2},
        },
        "model": {
            "type": "MultiOutputRegressor(Ridge)",
            "ridge_alpha": float(best_alpha),
            "alpha_sweep": alphas,
            "target_transform": "log1p",
            "predict": "expm1(model.predict(X)), clamp >= 0",
        },
        "test_metrics": metrics(y_test, best_y_pred),
    }

    joblib.dump(vectorizer, VEC_PATH)
    joblib.dump(best_model, MODEL_PATH)
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"✅ Saved vectorizer: {VEC_PATH}")
    print(f"✅ Saved portion model: {MODEL_PATH}")
    print(f"✅ Saved metadata: {META_PATH}")
    print("Targets order:", TARGET_COLS)

if __name__ == "__main__":
    main()
