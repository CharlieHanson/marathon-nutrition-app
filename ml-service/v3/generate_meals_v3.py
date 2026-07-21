import os
import random
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
TYPED_FOODS_CSV = os.path.join(DATA_DIR, "typed_foods.csv")
OUT_TRAINING = os.path.join(DATA_DIR, "training_portions.csv")

os.makedirs(DATA_DIR, exist_ok=True)

MEAL_TYPES = ["breakfast", "lunch", "dinner", "snacks", "desserts"]

def load_pools(df: pd.DataFrame) -> dict[str, list[str]]:
    pools = {}
    for t in ["protein", "carb", "vegetable", "fat"]:
        pools[t] = df[df["type"] == t]["description"].dropna().unique().tolist()
    # minimal safety
    for t in pools:
        if len(pools[t]) < 50:
            print(f"⚠️ Small pool for {t}: {len(pools[t])} rows (training may be weak).")
    return pools

def sample_grams(meal_type: str, rng: np.random.Generator, ing: dict[str, list[str]] | None = None) -> dict[str, float]:
    """
    Output grams for 4 types. These are *portion weights*.
    ing is optional; when provided, used for breakfast (fat only if present) and desserts (protein only if present).
    """
    ing = ing or {}
    if meal_type == "breakfast":
        fat_grams = float(rng.uniform(0, 16)) if ing.get("fat") else 0.0
        return {
            "protein": float(rng.uniform(70, 170)),
            "carb": float(rng.uniform(60, 180)),
            "vegetable": float(rng.uniform(0, 80)),
            "fat": fat_grams,
        }
    if meal_type == "lunch":
        return {
            "protein": float(rng.uniform(100, 200)),
            "carb": float(rng.uniform(80, 220)),
            "vegetable": float(rng.uniform(80, 240)),
            "fat": float(rng.uniform(5, 18)),
        }
    if meal_type == "dinner":
        return {
            "protein": float(rng.uniform(120, 240)),
            "carb": float(rng.uniform(80, 240)),
            "vegetable": float(rng.uniform(80, 260)),
            "fat": float(rng.uniform(6, 20)),
        }
    if meal_type == "snacks":
        return {
            "protein": float(rng.uniform(30, 120)),
            "carb": float(rng.uniform(20, 120)),
            "vegetable": float(rng.uniform(0, 80)),
            "fat": float(rng.uniform(4, 14)),
        }
    # desserts: always carb + fat; carb 80–240, fat 8–28; protein optional 0–40 (only if present)
    protein_grams = float(rng.uniform(0, 40)) if ing.get("protein") else 0.0
    return {
        "protein": protein_grams,
        "carb": float(rng.uniform(80, 240)),
        "vegetable": float(rng.uniform(0, 40)),
        "fat": float(rng.uniform(8, 28)),
    }

def choose_ingredients(meal_type: str, pools: dict[str, list[str]], rng: np.random.Generator) -> dict[str, list[str]]:
    """
    Create ingredient lists (names only) by type.
    These are the tokens your model learns from.
    """
    def pick(t: str, k_min: int, k_max: int) -> list[str]:
        k = int(rng.integers(k_min, k_max + 1))
        return rng.choice(pools[t], size=min(k, len(pools[t])), replace=False).tolist()

    ing = {"protein": [], "carb": [], "vegetable": [], "fat": []}

    if meal_type in ["lunch", "dinner"]:
        # Exactly: 1 protein, 1 carb, 1–2 veg, 0–1 fat
        ing["protein"] = pick("protein", 1, 1)
        ing["carb"] = pick("carb", 1, 1)
        ing["vegetable"] = pick("vegetable", 1, 2)
        ing["fat"] = pick("fat", 0, 1)
    elif meal_type == "breakfast":
        # Exactly: 1 protein + 1 carb; optionally 1 fat (60% of the time)
        ing["protein"] = pick("protein", 1, 1)
        ing["carb"] = pick("carb", 1, 1)
        ing["vegetable"] = pick("vegetable", 0, 1)
        ing["fat"] = pick("fat", 1, 1) if rng.random() < 0.6 else []
    elif meal_type == "snacks":
        ing["protein"] = pick("protein", 0, 1)
        ing["carb"] = pick("carb", 0, 2)
        ing["vegetable"] = pick("vegetable", 0, 1)
        ing["fat"] = pick("fat", 0, 1)
        # ensure not empty
        if not any(ing.values()):
            ing["carb"] = pick("carb", 1, 1)
    else:  # desserts: always carb + fat; protein optional (10% of the time)
        ing["carb"] = pick("carb", 1, 2)
        ing["fat"] = pick("fat", 1, 1)
        ing["protein"] = pick("protein", 1, 1) if rng.random() < 0.1 else []

    return ing

def build_feature_text(meal_type: str, ing: dict[str, list[str]]) -> str:
    parts = [f"MEALTYPE_{meal_type}"]
    order = ["protein", "carb", "vegetable", "fat"]
    for t in order:
        if ing[t]:
            # keep stable separators for TF-IDF consistency
            names = "; ".join(sorted(set([x.strip().lower() for x in ing[t] if x.strip()])))
            parts.append(f"{t}: {names}")
    return " | ".join(parts)

def main():
    if not os.path.exists(TYPED_FOODS_CSV):
        raise FileNotFoundError(f"Missing {TYPED_FOODS_CSV}. Run collect_data_v3.py first.")

    df = pd.read_csv(TYPED_FOODS_CSV)
    pools = load_pools(df)

    # How many synthetic rows?
    # Start moderate; you can scale to 50k+ later.
    N = int(os.environ.get("V3_TRAIN_SAMPLES", "25000"))
    seed = int(os.environ.get("V3_SEED", "42"))
    rng = np.random.default_rng(seed)

    rows = []
    for _ in range(N):
        meal_type = rng.choice(MEAL_TYPES).item()
        ing = choose_ingredients(meal_type, pools, rng)
        grams = sample_grams(meal_type, rng, ing=ing)

        # Labels are grams per type (4 outputs)
        row = {
            "meal_type": meal_type,
            "ingredients_text": build_feature_text(meal_type, ing),
            "g_protein": grams["protein"],
            "g_carb": grams["carb"],
            "g_vegetable": grams["vegetable"],
            "g_fat": grams["fat"],
        }
        rows.append(row)

    out = pd.DataFrame(rows)
    out.to_csv(OUT_TRAINING, index=False)
    print(f"✅ Wrote training portions: {OUT_TRAINING} ({len(out)} rows)")

if __name__ == "__main__":
    main()
