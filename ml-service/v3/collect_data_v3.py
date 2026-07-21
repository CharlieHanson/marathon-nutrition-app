import os
import json
import re
import pandas as pd

# Paths
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")

NUTRITION_CSV = os.path.join(DATA_DIR, "nutrition_data.csv")
TYPED_FOODS_CSV = os.path.join(DATA_DIR, "typed_foods.csv")
DENSITIES_JSON = os.path.join(MODELS_DIR, "type_macro_densities.json")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Heuristic filters
COMPOSED_MEAL_PATTERNS = [
    "sandwich", "burger", "pizza", "burrito", "wrap", "taco", "bowl", "sub", "hoagie",
    "gyro", "quesadilla", "nacho", "lasagna", "mac and cheese", "ramen", "pad thai",
    "fried rice", "lo mein", "casserole", "hot dog", "cheeseburger", "sushi roll",
    "prepared", "ready-to-eat", "meal", "entree", "combo"
]

def is_composed_meal(desc: str) -> bool:
    d = desc.lower()
    return any(p in d for p in COMPOSED_MEAL_PATTERNS)

def normalize_desc(desc: str) -> str:
    desc = (desc or "").strip().lower()
    desc = re.sub(r"\s+", " ", desc)
    return desc

def assign_primary_type(desc: str) -> str | None:
    """
    Assign ONE primary type based on keywords.
    Types we care about for training densities:
      protein, carb, vegetable, fat
    (Sauce/dairy can exist later in the OpenAI parse, but this v3 model predicts only 4 grams outputs.)
    """
    d = desc.lower()

    # Fat keywords first (pure oils/butters)
    fat_kw = ["oil", "butter", "margarine", "lard", "shortening", "ghee", "mayonnaise", "avocado oil", "olive oil"]
    if any(k in d for k in fat_kw):
        return "fat"

    # Protein keywords
    protein_kw = [
        "chicken", "turkey", "beef", "pork", "salmon", "tuna", "shrimp", "fish", "cod", "tilapia",
        "egg", "eggs", "tofu", "tempeh", "seitan", "lentil", "lentils", "beans", "bean", "chickpea",
        "yogurt", "greek yogurt", "cottage cheese", "cheese", "milk", "whey", "protein"
    ]
    if any(k in d for k in protein_kw):
        return "protein"

    # Carb keywords
    carb_kw = [
        "rice", "pasta", "bread", "bagel", "tortilla", "wrap", "oat", "oats", "cereal", "granola",
        "potato", "sweet potato", "quinoa", "couscous", "noodle", "noodles",
        "flour", "corn", "cornmeal", "cracker", "crackers"
    ]
    if any(k in d for k in carb_kw):
        return "carb"

    # Vegetable keywords
    veg_kw = [
        "broccoli", "spinach", "kale", "lettuce", "salad", "pepper", "peppers", "onion", "tomato",
        "carrot", "cauliflower", "zucchini", "cucumber", "mushroom", "asparagus", "green bean",
        "brussels", "cabbage", "celery", "eggplant", "vegetable"
    ]
    if any(k in d for k in veg_kw):
        return "vegetable"

    return None


# --- Purity filter helpers (per-100g macros + description keywords) ---
def _passes_protein_purity(row: pd.Series) -> bool:
    p = row.get("protein_100g", 0)
    c = row.get("carbs_100g", 0)
    f = row.get("fat_100g", 0)
    return p >= 15 and c <= 15 and f <= 25


def _passes_vegetable_purity(row: pd.Series) -> bool:
    p = row.get("protein_100g", 0)
    c = row.get("carbs_100g", 0)
    f = row.get("fat_100g", 0)
    return c <= 15 and f <= 5 and p <= 10


# Carb: cooked carbs only; exclude dry/processed
CARB_COOKED_KEYWORDS = [
    "cooked", "boiled", "steamed", "prepared", "ready-to-serve",
    "rice, cooked", "pasta", "couscous, cooked", "quinoa, cooked",
    "potato, baked", "sweet potato"
]
CARB_EXCLUDE_KEYWORDS = [
    "cereal", "granola", "flour", "cracker", "rice cake", "bar", "cookie", "chips",
    "raw oats", "dry"
]


def _passes_carb_purity(row: pd.Series) -> bool:
    desc = (row.get("description") or "").lower()
    c = row.get("carbs_100g", 0)
    f = row.get("fat_100g", 0)
    if c < 10 or c > 35 or f > 10:
        return False
    if any(ex in desc for ex in CARB_EXCLUDE_KEYWORDS):
        return False
    return any(kw in desc for kw in CARB_COOKED_KEYWORDS)


# Fat: added fats (oils/butter); exclude nut butters / sweets
FAT_INCLUDE_KEYWORDS = ["oil", "butter", "ghee", "lard", "shortening", "margarine"]
FAT_EXCLUDE_KEYWORDS = [
    "peanut butter", "almond butter", "tahini", "seed butter",
    "cookie", "brownie", "jelly", "fruit salad"
]


def _passes_fat_purity(row: pd.Series) -> bool:
    desc = (row.get("description") or "").lower()
    p = row.get("protein_100g", 0)
    c = row.get("carbs_100g", 0)
    f = row.get("fat_100g", 0)
    if f < 60 or c > 10 or p > 10:
        return False
    if any(ex in desc for ex in FAT_EXCLUDE_KEYWORDS):
        return False
    return any(kw in desc for kw in FAT_INCLUDE_KEYWORDS)


def passes_type_purity(row: pd.Series) -> bool:
    t = row.get("type")
    if t == "protein":
        return _passes_protein_purity(row)
    if t == "vegetable":
        return _passes_vegetable_purity(row)
    if t == "carb":
        return _passes_carb_purity(row)
    if t == "fat":
        return _passes_fat_purity(row)
    return True

def main():
    if not os.path.exists(NUTRITION_CSV):
        raise FileNotFoundError(
            f"Missing {NUTRITION_CSV}. Put your USDA export there "
            f"(copy your existing nutrition_data.csv into v3/data/)."
        )

    df = pd.read_csv(NUTRITION_CSV)

    # Expect columns similar to your existing pipeline:
    # description, calories, protein_g, carbs_g, fat_g
    # If yours differ, adjust here.
    required = ["description", "protein_g", "carbs_g", "fat_g"]
    for c in required:
        if c not in df.columns:
            raise ValueError(f"nutrition_data.csv missing required column: {c}")

    df["description"] = df["description"].astype(str).map(normalize_desc)

    # Remove composed meals / junk
    df = df[~df["description"].map(is_composed_meal)].copy()

    # Filter invalid macros
    for col in ["protein_g", "carbs_g", "fat_g"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=["protein_g", "carbs_g", "fat_g"])
    df = df[(df["protein_g"] >= 0) & (df["carbs_g"] >= 0) & (df["fat_g"] >= 0)].copy()

    # Rename to per-100g for purity filters and density computation
    df = df.rename(columns={
        "protein_g": "protein_100g",
        "carbs_g": "carbs_100g",
        "fat_g": "fat_100g",
    })

    # Assign primary type
    df["type"] = df["description"].map(assign_primary_type)
    df = df.dropna(subset=["type"]).copy()

    # Purity filters: keep only rows that pass the filter for their assigned type
    mask = df.apply(passes_type_purity, axis=1)
    df = df[mask].copy()

    # Save typed foods (post-purity)
    keep_cols = ["description", "type", "protein_100g", "carbs_100g", "fat_100g"]
    typed = df[keep_cols].drop_duplicates(subset=["description", "type"]).reset_index(drop=True)
    typed.to_csv(TYPED_FOODS_CSV, index=False)
    print(f"✅ Wrote typed foods: {TYPED_FOODS_CSV} ({len(typed)} rows)")

    # Safe defaults when a type has < 10 rows after filtering
    DENSITY_DEFAULTS = {
        "protein": {"p_per_g": 0.25, "c_per_g": 0.02, "f_per_g": 0.10},
        "carb": {"p_per_g": 0.03, "c_per_g": 0.23, "f_per_g": 0.02},
        "vegetable": {"p_per_g": 0.02, "c_per_g": 0.06, "f_per_g": 0.01},
        "fat": {"p_per_g": 0.00, "c_per_g": 0.00, "f_per_g": 1.00},
    }
    MIN_ROWS_FOR_DENSITY = 10

    # Carb density subset: for density computation only, further filter carb rows
    CARB_DENSITY_EXCLUDE_KEYWORDS = ["with", "sauce", "cream", "cheese", "butter", "oil", "fried"]
    carb_base = typed[typed["type"] == "carb"]
    carb_desc_ok = ~carb_base["description"].str.lower().str.contains(
        "|".join(re.escape(k) for k in CARB_DENSITY_EXCLUDE_KEYWORDS), regex=True, na=False
    )
    carb_density_subset = carb_base[
        carb_desc_ok
        & (carb_base["carbs_100g"] >= 10)
        & (carb_base["carbs_100g"] <= 40)
        & (carb_base["fat_100g"] <= 8)
        & (carb_base["protein_100g"] <= 10)
    ].copy()

    # Compute macro densities per gram for each type (median for robustness)
    densities = {}
    for t in ["protein", "carb", "vegetable", "fat"]:
        if t == "carb":
            g = carb_density_subset
        else:
            g = typed[typed["type"] == t]
        n = len(g)
        if n < MIN_ROWS_FOR_DENSITY:
            densities[t] = DENSITY_DEFAULTS[t].copy()
            print(f"  [{t}] n={n} < {MIN_ROWS_FOR_DENSITY} → using defaults")
        else:
            p_per_g = float((g["protein_100g"] / 100.0).median())
            c_per_g = float((g["carbs_100g"] / 100.0).median())
            f_per_g = float((g["fat_100g"] / 100.0).median())
            densities[t] = {"p_per_g": p_per_g, "c_per_g": c_per_g, "f_per_g": f_per_g}

    # Carb density: print count used and resulting values
    n_carb_density = len(carb_density_subset)
    d_carb = densities["carb"]
    print(f"\n  [carb density] n_used={n_carb_density}  p_per_g={d_carb['p_per_g']:.4f} c_per_g={d_carb['c_per_g']:.4f} f_per_g={d_carb['f_per_g']:.4f}\n")

    # Summary: rows per type and resulting densities
    print("\n--- Purity filter summary ---")
    for t in ["protein", "carb", "vegetable", "fat"]:
        n = len(typed[typed["type"] == t])
        d = densities[t]
        print(f"  {t}: n={n}  p_per_g={d['p_per_g']:.4f} c_per_g={d['c_per_g']:.4f} f_per_g={d['f_per_g']:.4f}")
    print("---\n")

    with open(DENSITIES_JSON, "w") as f:
        json.dump(densities, f, indent=2)
    print(f"✅ Wrote type macro densities: {DENSITIES_JSON}")

if __name__ == "__main__":
    main()
