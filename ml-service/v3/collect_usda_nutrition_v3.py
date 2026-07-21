import os
import time
import requests
import pandas as pd
from dotenv import load_dotenv

# -----------------------
# Config / Paths
# -----------------------
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

OUT_CSV = os.path.join(DATA_DIR, "nutrition_data.csv")

# Load .env.local from ml-service/.env.local (same as you’re doing)
load_dotenv(os.path.join(os.path.dirname(BASE_DIR), ".env.local"))
API_KEY = "wCmq5O4qU4NVPsavw0JSx9vJgCp4KPFJY0iGntuC"
if not API_KEY:
    raise ValueError("⚠️ USDA_API_KEY not found in .env.local")

BASE_URL = "https://api.nal.usda.gov/fdc/v1"
SEARCH_URL = f"{BASE_URL}/foods/search"

PAGE_SIZE = int(os.getenv("USDA_PAGE_SIZE", "25"))
MAX_PAGES_PER_TERM = int(os.getenv("USDA_MAX_PAGES", "3"))  # cap even if totalPages is huge
SLEEP_SECONDS = float(os.getenv("USDA_SLEEP", "0.25"))
TIMEOUT = int(os.getenv("USDA_TIMEOUT", "20"))

# Keep these, but we will RETRY without dataType if we get 400
DATA_TYPES = ["Foundation", "SR Legacy", "Survey (FNDDS)"]

# -----------------------
# Terms (tuned for v3)
# -----------------------
FATS_TERMS = [
    "olive oil", "canola oil", "vegetable oil", "avocado oil", "sesame oil",
    "butter", "unsalted butter", "salted butter", "ghee", "lard",
    "shortening", "margarine"
]

COOKED_CARBS_TERMS = [
    "white rice cooked", "brown rice cooked", "rice cooked",
    "pasta cooked", "spaghetti cooked", "macaroni cooked",
    "quinoa cooked", "couscous cooked", "barley cooked",
    "potato baked", "potato boiled", "sweet potato baked", "sweet potato boiled",
    "oatmeal cooked"
]

PROTEINS_TERMS = [
    "chicken breast", "salmon", "tuna", "turkey breast", "ground turkey",
    "lean beef", "ground beef", "pork loin",
    "egg", "tofu", "tempeh",
    "lentils cooked", "black beans cooked", "chickpeas cooked",
    "greek yogurt", "cottage cheese"
]

VEGETABLES_TERMS = [
    "broccoli", "spinach", "kale", "carrot", "bell pepper", "onion", "tomato",
    "zucchini", "mushroom", "cauliflower", "lettuce", "cucumber",
    "asparagus", "green beans"
]

SAUCES_TERMS = ["soy sauce", "teriyaki sauce", "marinara sauce", "pesto", "salsa", "hot sauce"]

SEARCH_TERMS = list(dict.fromkeys(FATS_TERMS + COOKED_CARBS_TERMS + PROTEINS_TERMS + VEGETABLES_TERMS + SAUCES_TERMS))

# -----------------------
# Helpers
# -----------------------
def _mask_key(s: str) -> str:
    if not API_KEY or not s:
        return s
    return s.replace(API_KEY, "****REDACTED****")

def search_foods(term: str, page_number: int, use_datatypes: bool = True) -> dict:
    params = {
        "api_key": API_KEY,
        "query": term,
        "pageSize": PAGE_SIZE,
        "pageNumber": page_number,
    }
    if use_datatypes:
        # Pass as repeated parameters
        params["dataType"] = DATA_TYPES

    resp = requests.get(SEARCH_URL, params=params, timeout=TIMEOUT)
    # Let caller handle status
    resp.raise_for_status()
    return resp.json()

def extract_macros(food_item: dict):
    nutrients = food_item.get("foodNutrients", [])
    if not nutrients:
        return None

    want = {
        "Energy": "calories",
        "Protein": "protein_g",
        "Carbohydrate, by difference": "carbs_g",
        "Total lipid (fat)": "fat_g",
    }

    out = {}
    for n in nutrients:
        name = n.get("nutrientName")
        if name in want:
            val = n.get("value", None)
            if val is None:
                continue
            out[want[name]] = float(val)

    if not all(k in out for k in ("calories", "protein_g", "carbs_g", "fat_g")):
        return None

    # minimal sanity
    if any(out[k] < 0 for k in ("calories", "protein_g", "carbs_g", "fat_g")):
        return None

    # drop clearly broken rows
    if out["calories"] > 2000 or out["protein_g"] > 150 or out["carbs_g"] > 250 or out["fat_g"] > 150:
        return None

    return out

def normalize_desc(desc: str) -> str:
    return " ".join((desc or "").strip().split())

def fetch_term(term: str):
    """
    Fetch up to MAX_PAGES_PER_TERM pages.
    Fixes your earlier 400 spam by:
      - reading totalPages from page 1
      - only requesting existing pages
    Also: retry without dataType filters if a 400 happens.
    """
    rows = []

    def do_page(page: int, use_datatypes: bool):
        return search_foods(term, page_number=page, use_datatypes=use_datatypes)

    # First try page 1 with dataTypes; if that fails with 400, retry without.
    try:
        data = do_page(1, use_datatypes=True)
        used_datatypes = True
    except requests.HTTPError as e:
        status = getattr(e.response, "status_code", None)
        if status == 400:
            data = do_page(1, use_datatypes=False)
            used_datatypes = False
        else:
            raise

    foods = data.get("foods", [])
    total_pages = int(data.get("totalPages", 1) or 1)
    pages_to_fetch = min(total_pages, MAX_PAGES_PER_TERM)

    # Process page 1
    for food in foods:
        macros = extract_macros(food)
        if not macros:
            continue
        rows.append({
            "fdc_id": int(food.get("fdcId")),
            "description": normalize_desc(food.get("description", "")),
            "data_type": food.get("dataType", ""),
            "query_term": term,
            **macros
        })

    # Process remaining pages safely
    for page in range(2, pages_to_fetch + 1):
        time.sleep(SLEEP_SECONDS)
        try:
            d = do_page(page, use_datatypes=used_datatypes)
        except requests.HTTPError as e:
            # If a later page fails, stop paging for this term
            print(f"  ⚠️ page {page} failed; stopping term='{term}'. {e}")
            break

        for food in d.get("foods", []):
            macros = extract_macros(food)
            if not macros:
                continue
            rows.append({
                "fdc_id": int(food.get("fdcId")),
                "description": normalize_desc(food.get("description", "")),
                "data_type": food.get("dataType", ""),
                "query_term": term,
                **macros
            })

    return rows, pages_to_fetch, used_datatypes

# -----------------------
# Main
# -----------------------
def main():
    print("🔍 Collecting USDA nutrition data for v3...")
    print(f"Terms: {len(SEARCH_TERMS)} | pageSize={PAGE_SIZE} | maxPages/term={MAX_PAGES_PER_TERM}")
    print("Data types (preferred):", DATA_TYPES)

    all_rows = []
    seen_fdc = set()

    for i, term in enumerate(SEARCH_TERMS, start=1):
        print(f"\n[{i}/{len(SEARCH_TERMS)}] Searching: {term}")
        try:
            rows, pages, used_dt = fetch_term(term)
        except Exception as e:
            msg = _mask_key(str(e))
            print(f"  ⚠️ term failed: {msg}")
            continue

        kept_new = 0
        for r in rows:
            fdc_id = r.get("fdc_id")
            if not fdc_id or fdc_id in seen_fdc:
                continue
            seen_fdc.add(fdc_id)
            all_rows.append(r)
            kept_new += 1

        print(f"  pages_fetched={pages} used_dataType_filters={used_dt} kept_new={kept_new} total_unique={len(seen_fdc)}")
        time.sleep(SLEEP_SECONDS)

    df = pd.DataFrame(all_rows)
    if df.empty:
        raise RuntimeError("No foods collected. Check API key or terms.")

    df = df.drop_duplicates(subset=["fdc_id"]).reset_index(drop=True)
    df.to_csv(OUT_CSV, index=False)

    print(f"\n✅ Saved {len(df)} foods to {OUT_CSV}")

    # quick counters
    low = df["description"].str.lower()
    print("\nCounts (approx):")
    print("  oil:", int(low.str.contains("oil", na=False).sum()))
    print("  butter:", int(low.str.contains("butter", na=False).sum()))
    print("  rice:", int(low.str.contains("rice", na=False).sum()))
    print("  cooked:", int(low.str.contains("cooked", na=False).sum()))

if __name__ == "__main__":
    main()
