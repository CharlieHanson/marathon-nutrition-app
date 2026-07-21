import os
import json
import numpy as np
import requests
import pandas as pd

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")

EVAL_CSV = os.path.join(DATA_DIR, "eval_meals.csv")
DENSITIES_JSON = os.path.join(MODELS_DIR, "type_macro_densities.json")

ML_URL = os.environ.get("ML_URL", "http://localhost:5000/predict-v3")

# Types we sum for true grams (ignore sauce/dairy)
GRAM_TYPES = ["protein", "carb", "vegetable", "fat"]


def true_grams_from_ingredients(ingredients: list[dict]) -> dict[str, float]:
    """Parse ingredients_json and sum grams by type. Returns true_g_protein, true_g_carb, true_g_vegetable, true_g_fat."""
    out = {t: 0.0 for t in GRAM_TYPES}
    for ing in ingredients:
        t = (ing.get("type") or "").strip().lower()
        if t not in GRAM_TYPES:
            continue
        g = float(ing.get("grams", 0) or 0)
        if g > 0:
            out[t] += g
    return out


def calories_from_grams(grams: dict[str, float], densities: dict) -> float:
    """P/C/F = sum(g_type * density[type][p/c/f]_per_g); Calories = 4*P + 4*C + 9*F."""
    P = sum(grams.get(t, 0.0) * densities.get(t, {}).get("p_per_g", 0.0) for t in GRAM_TYPES)
    C = sum(grams.get(t, 0.0) * densities.get(t, {}).get("c_per_g", 0.0) for t in GRAM_TYPES)
    F = sum(grams.get(t, 0.0) * densities.get(t, {}).get("f_per_g", 0.0) for t in GRAM_TYPES)
    return 4 * P + 4 * C + 9 * F


def call_predict_v3(meal_type: str, ingredients: list[dict], debug: bool = True):
    payload = {
        "meal_type": meal_type,
        "ingredients": [{"name": ing["name"], "type": ing["type"]} for ing in ingredients],
        "debug": debug,
    }
    r = requests.post(ML_URL, json=payload, timeout=30)
    r.raise_for_status()
    return r.json()


def main():
    if not os.path.exists(EVAL_CSV):
        raise FileNotFoundError(f"Missing {EVAL_CSV}. Create eval_meals.csv (see instructions).")
    if not os.path.exists(DENSITIES_JSON):
        raise FileNotFoundError(f"Missing {DENSITIES_JSON}. Run collect_data_v3.py first.")

    with open(DENSITIES_JSON) as f:
        densities = json.load(f)

    eval_df = pd.read_csv(EVAL_CSV)
    if "meal_type" not in eval_df.columns or "ingredients_json" not in eval_df.columns:
        raise ValueError("eval_meals.csv must have columns: meal_type, ingredients_json")

    rows = []
    for i, r in eval_df.iterrows():
        meal_type = str(r["meal_type"]).strip().lower()
        ingredients = json.loads(r["ingredients_json"])

        true_grams = true_grams_from_ingredients(ingredients)
        true_cal = calories_from_grams(true_grams, densities)

        pred_resp = call_predict_v3(meal_type, ingredients, debug=True)
        pred_grams = None
        if pred_resp.get("success"):
            pred_grams = pred_resp.get("predicted_grams")
            required_keys = ["protein", "carb", "vegetable", "fat"]
            if not pred_grams or not all(k in pred_grams for k in required_keys):
                raise RuntimeError(
                    "predict-v3 did not return predicted_grams. Restart server after updating app.py."
                )
        pred_cal = None
        if pred_resp.get("success") and pred_grams:
            pred_cal = calories_from_grams(
                {
                    "protein": pred_grams.get("protein", 0),
                    "carb": pred_grams.get("carb", 0),
                    "vegetable": pred_grams.get("vegetable", 0),
                    "fat": pred_grams.get("fat", 0),
                },
                densities,
            )
        else:
            pred = pred_resp.get("predictions", {})
            pred_cal = float(pred.get("calories", float("nan"))) if pred else float("nan")

        row = {
            "idx": i,
            "meal_type": meal_type,
            "true_g_protein": true_grams["protein"],
            "true_g_carb": true_grams["carb"],
            "true_g_vegetable": true_grams["vegetable"],
            "true_g_fat": true_grams["fat"],
            "pred_g_protein": float(pred_grams.get("protein", float("nan"))) if pred_grams else float("nan"),
            "pred_g_carb": float(pred_grams.get("carb", float("nan"))) if pred_grams else float("nan"),
            "pred_g_vegetable": float(pred_grams.get("vegetable", float("nan"))) if pred_grams else float("nan"),
            "pred_g_fat": float(pred_grams.get("fat", float("nan"))) if pred_grams else float("nan"),
            "true_cal": true_cal,
            "pred_cal": pred_cal,
        }
        rows.append(row)

    out = pd.DataFrame(rows)

    # Drop rows where prediction failed (nan pred_cal) before gram/cal metrics
    out = out.dropna(subset=["pred_cal"])

    # Coerce gram columns to float and assert finite before computing MAE
    gram_cols = [
        "true_g_protein", "true_g_carb", "true_g_vegetable", "true_g_fat",
        "pred_g_protein", "pred_g_carb", "pred_g_vegetable", "pred_g_fat",
    ]
    for c in gram_cols:
        out[c] = out[c].astype(float)
        assert np.isfinite(out[c]).all(), f"Non-finite values in {c}"

    # Gram MAEs
    out["mae_protein"] = (out["pred_g_protein"] - out["true_g_protein"]).abs()
    out["mae_carb"] = (out["pred_g_carb"] - out["true_g_carb"]).abs()
    out["mae_vegetable"] = (out["pred_g_vegetable"] - out["true_g_vegetable"]).abs()
    out["mae_fat"] = (out["pred_g_fat"] - out["true_g_fat"]).abs()
    out["mae_grams_overall"] = (out["mae_protein"] + out["mae_carb"] + out["mae_vegetable"] + out["mae_fat"]) / 4.0

    # Calories (both from type_macro_densities)
    out["cal_mae"] = (out["pred_cal"] - out["true_cal"]).abs()
    out["cal_mape"] = out.apply(
        lambda x: (abs(x["pred_cal"] - x["true_cal"]) / x["true_cal"]) if x["true_cal"] > 0 else (0.0 if x["pred_cal"] == 0 else 1.0),
        axis=1,
    )
    out["within15_cal"] = out["cal_mape"] <= 0.15
    out["within25_cal"] = out["cal_mape"] <= 0.25

    def summarize(df: pd.DataFrame, label: str):
        n = len(df)
        if n == 0:
            print(f"\n{label}: no rows")
            return
        print(f"\n{label} (n={n})")
        print("  Gram MAE (g):")
        print(f"    protein:   {df['mae_protein'].mean():.1f}")
        print(f"    carb:     {df['mae_carb'].mean():.1f}")
        print(f"    vegetable: {df['mae_vegetable'].mean():.1f}")
        print(f"    fat:      {df['mae_fat'].mean():.1f}")
        print(f"    overall (avg of 4): {df['mae_grams_overall'].mean():.1f}")
        print("  Calories (from type_macro_densities):")
        print(f"    MAE: {df['cal_mae'].mean():.1f}")
        print(f"    within ±15%: {df['within15_cal'].mean() * 100:.1f}%")
        print(f"    within ±25%: {df['within25_cal'].mean() * 100:.1f}%")

    summarize(out, "OVERALL")
    for mt, grp in out.groupby("meal_type"):
        summarize(grp, f"MEAL TYPE: {mt}")

    report_path = os.path.join(DATA_DIR, "eval_report_v3.csv")
    out.to_csv(report_path, index=False)
    print(f"\n✅ Wrote detailed report: {report_path}")


if __name__ == "__main__":
    main()
