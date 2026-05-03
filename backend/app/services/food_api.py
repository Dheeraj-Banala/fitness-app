import httpx
import os
import re

OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/search"
USDA_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

headers = {
    "User-Agent": "food-and-fitness-app/1.0",
    "Accept": "application/json"
}

def _g_to_mg(value):
    return round(value * 1000, 2) if value is not None else None

def _per1g(value):
    return round(value / 100, 6) if value is not None else None

def _parse_off_serving(serving_str: str | None) -> tuple[str | None, float | None]:
    """Parse OFF serving_size string into (name, grams_per_unit). Returns (None, None) on failure."""
    if not serving_str:
        return None, None
    s = serving_str.strip()
    # Skip ml-only strings (density unknown)
    if re.fullmatch(r'[\d.]+\s*ml', s, re.IGNORECASE):
        return None, None
    # Extract grams value
    g_match = re.search(r'(\d+(?:\.\d+)?)\s*g\b', s, re.IGNORECASE)
    if not g_match:
        return None, None
    grams = float(g_match.group(1))
    if grams <= 0:
        return None, None
    # Try "N? name (Xg)" pattern for a named serving
    name_match = re.match(r'^(\d+(?:\.\d+)?)?\s*([a-zA-Z][a-zA-Z ]{1,19}?)\s*\(', s)
    if name_match:
        count = float(name_match.group(1)) if name_match.group(1) else 1.0
        name = name_match.group(2).strip().lower()
        generic = {'g', 'gram', 'grams', 'ml', 'serving', 'servings', 'portion', 'portions'}
        if name not in generic:
            # Singularize: strip trailing 's' unless it ends in 'ss'
            if name.endswith('s') and not name.endswith('ss') and len(name) > 3:
                name = name[:-1]
            per_unit_g = round(grams / count, 2) if count > 1 else grams
            return name, per_unit_g
    return None, grams

def _off_nutrients(nutriments: dict) -> dict:
    return {
        "calories": _per1g(nutriments.get("energy-kcal_100g")),
        "protein": _per1g(nutriments.get("proteins_100g")),
        "carbs": _per1g(nutriments.get("carbohydrates_100g")),
        "fat": _per1g(nutriments.get("fat_100g")),
        "fiber": _per1g(nutriments.get("fiber_100g")),
        "sugar": _per1g(nutriments.get("sugars_100g")),
        "saturated_fat": _per1g(nutriments.get("saturated-fat_100g")),
        "sodium": _per1g(_g_to_mg(nutriments.get("sodium_100g"))),
        "potassium": _per1g(_g_to_mg(nutriments.get("potassium_100g"))),
        "calcium": _per1g(_g_to_mg(nutriments.get("calcium_100g"))),
        "magnesium": _per1g(_g_to_mg(nutriments.get("magnesium_100g"))),
        "iron": _per1g(_g_to_mg(nutriments.get("iron_100g"))),
        "zinc": _per1g(_g_to_mg(nutriments.get("zinc_100g"))),
        "vitamin_d": None,
        "vitamin_c": None,
        "vitamin_a": None,
        "vitamin_b12": None,
        "folate": None,
    }

def search_open_food_facts(query: str) -> list[dict]:
    params = {
        "search_terms": query,
        "json": 1,
        "page_size": 10,
        "fields": "product_name,nutriments,serving_size"
    }

    with httpx.Client() as client:
        response = client.get(OPEN_FOOD_FACTS_URL, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()

    results = []
    for product in data.get("products", []):
        name = product.get("product_name", "").strip()
        if not name:
            continue
        serving_name, serving_g = _parse_off_serving(product.get("serving_size"))
        results.append({
            "name": name,
            "source": "open_food_facts",
            "serving_size": 1,
            "serving_unit": "g",
            "default_serving_name": serving_name,
            "default_serving_g": serving_g,
            **_off_nutrients(product.get("nutriments", {})),
        })
    return results

def lookup_barcode(barcode: str) -> dict | None:
    url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"

    with httpx.Client() as client:
        response = client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

    if data.get("status") != 1:
        return None

    product = data.get("product", {})
    name = product.get("product_name", "").strip()
    if not name:
        return None

    serving_name, serving_g = _parse_off_serving(product.get("serving_size"))
    return {
        "name": name,
        "source": "open_food_facts",
        "serving_size": 1,
        "serving_unit": "g",
        "default_serving_name": serving_name,
        "default_serving_g": serving_g,
        **_off_nutrients(product.get("nutriments", {})),
    }

def _pos(value):
    return max(0, value) if value is not None else None

def search_usda(query: str) -> list[dict]:
    params = {
        "query": query,
        "pageSize": 20,
        "dataType": "Foundation,SR Legacy",
        "api_key": os.getenv("USDA_API_KEY")
    }

    with httpx.Client() as client:
        response = client.get(USDA_URL, params=params)
        response.raise_for_status()
        data = response.json()

    results = []
    for food in data.get("foods", []):
        nutrients = {n["nutrientName"]: n["value"] for n in food.get("foodNutrients", [])}
        energy_kcal = next(
            (n["value"] for n in food.get("foodNutrients", [])
             if n["nutrientName"] == "Energy" and n.get("unitName", "").upper() == "KCAL"),
            None
        ) or nutrients.get("Energy (Atwater General Factors)") or nutrients.get("Energy (Atwater Specific Factors)")
        results.append({
            "name": food.get("description", ""),
            "source": "usda",
            "external_id": str(food.get("fdcId")),
            "data_type": food.get("dataType"),
            "serving_size": 1,
            "serving_unit": "g",
            "default_serving_name": None,
            "default_serving_g": None,
            "calories": _per1g(energy_kcal),
            "protein": _per1g(_pos(nutrients.get("Protein"))),
            "carbs": _per1g(_pos(nutrients.get("Carbohydrate, by difference"))),
            "fat": _per1g(_pos(nutrients.get("Total lipid (fat)"))),
            "fiber": _per1g(_pos(nutrients.get("Fiber, total dietary"))),
            "sugar": _per1g(_pos(nutrients.get("Sugars, total including NLEA"))),
            "saturated_fat": _per1g(_pos(nutrients.get("Fatty acids, total saturated"))),
            "sodium": _per1g(_pos(nutrients.get("Sodium, Na"))),
            "potassium": _per1g(_pos(nutrients.get("Potassium, K"))),
            "calcium": _per1g(_pos(nutrients.get("Calcium, Ca"))),
            "magnesium": _per1g(_pos(nutrients.get("Magnesium, Mg"))),
            "iron": _per1g(_pos(nutrients.get("Iron, Fe"))),
            "zinc": _per1g(_pos(nutrients.get("Zinc, Zn"))),
            "vitamin_d": _per1g(_pos(nutrients.get("Vitamin D (D2 + D3)"))),
            "vitamin_c": _per1g(_pos(nutrients.get("Vitamin C, total ascorbic acid"))),
            "vitamin_a": _per1g(_pos(nutrients.get("Vitamin A, RAE"))),
            "vitamin_b12": _per1g(_pos(nutrients.get("Vitamin B-12"))),
            "folate": _per1g(_pos(nutrients.get("Folate, DFE"))),
        })
    return results