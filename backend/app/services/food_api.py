import httpx
import os

OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/search"
USDA_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

headers = {
    "User-Agent": "food-and-fitness-app/1.0",
    "Accept": "application/json"
}

def _g_to_mg(value):
    return round(value * 1000, 2) if value is not None else None

def _off_nutrients(nutriments: dict) -> dict:
    return {
        "calories": nutriments.get("energy-kcal_100g"),
        "protein": nutriments.get("proteins_100g"),
        "carbs": nutriments.get("carbohydrates_100g"),
        "fat": nutriments.get("fat_100g"),
        "fiber": nutriments.get("fiber_100g"),
        "sugar": nutriments.get("sugars_100g"),
        "saturated_fat": nutriments.get("saturated-fat_100g"),
        "sodium": _g_to_mg(nutriments.get("sodium_100g")),
        "potassium": _g_to_mg(nutriments.get("potassium_100g")),
        "calcium": _g_to_mg(nutriments.get("calcium_100g")),
        "magnesium": _g_to_mg(nutriments.get("magnesium_100g")),
        "iron": _g_to_mg(nutriments.get("iron_100g")),
        "zinc": _g_to_mg(nutriments.get("zinc_100g")),
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
        results.append({
            "name": name,
            "source": "open_food_facts",
            "serving_size": 100,
            "serving_unit": "g",
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

    return {
        "name": name,
        "source": "open_food_facts",
        "serving_size": 100,
        "serving_unit": "g",
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
            "serving_size": 100,
            "serving_unit": "g",
            "calories": energy_kcal,
            "protein": _pos(nutrients.get("Protein")),
            "carbs": _pos(nutrients.get("Carbohydrate, by difference")),
            "fat": _pos(nutrients.get("Total lipid (fat)")),
            "fiber": _pos(nutrients.get("Fiber, total dietary")),
            "sugar": _pos(nutrients.get("Sugars, total including NLEA")),
            "saturated_fat": _pos(nutrients.get("Fatty acids, total saturated")),
            "sodium": _pos(nutrients.get("Sodium, Na")),
            "potassium": _pos(nutrients.get("Potassium, K")),
            "calcium": _pos(nutrients.get("Calcium, Ca")),
            "magnesium": _pos(nutrients.get("Magnesium, Mg")),
            "iron": _pos(nutrients.get("Iron, Fe")),
            "zinc": _pos(nutrients.get("Zinc, Zn")),
            "vitamin_d": _pos(nutrients.get("Vitamin D (D2 + D3)")),
            "vitamin_c": _pos(nutrients.get("Vitamin C, total ascorbic acid")),
            "vitamin_a": _pos(nutrients.get("Vitamin A, RAE")),
            "vitamin_b12": _pos(nutrients.get("Vitamin B-12")),
            "folate": _pos(nutrients.get("Folate, DFE")),
        })
    return results