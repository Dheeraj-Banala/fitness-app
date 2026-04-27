import httpx
import os

OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/search"
USDA_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

headers = {
    "User-Agent": "food-and-fitness-app/1.0",
    "Accept": "application/json"
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
        nutriments = product.get("nutriments", {})
        name = product.get("product_name", "").strip()
        if not name:
            continue
        results.append({
            "name": name,
            "source": "open_food_facts",
            "serving_size": 100,
            "serving_unit": "g",
            "calories": nutriments.get("energy-kcal_100g"),
            "protein": nutriments.get("proteins_100g"),
            "carbs": nutriments.get("carbohydrates_100g"),
            "fat": nutriments.get("fat_100g"),
            "fiber": nutriments.get("fiber_100g"),
            "sugar": nutriments.get("sugars_100g"),
            "saturated_fat": nutriments.get("saturated-fat_100g"),
            "sodium": nutriments.get("sodium_100g"),
        })
    return results

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
        results.append({
            "name": food.get("description", ""),
            "source": "usda",
            "external_id": str(food.get("fdcId")),
            "data_type": food.get("dataType"),
            "serving_size": 100,
            "serving_unit": "g",
            "calories": nutrients.get("Energy") or nutrients.get("Energy (Atwater General Factors)") or nutrients.get("Energy (Atwater Specific Factors)"),
            "protein": _pos(nutrients.get("Protein")),
            "carbs": _pos(nutrients.get("Carbohydrate, by difference")),
            "fat": _pos(nutrients.get("Total lipid (fat)")),
            "fiber": _pos(nutrients.get("Fiber, total dietary")),
            "sugar": _pos(nutrients.get("Sugars, total including NLEA")),
            "saturated_fat": _pos(nutrients.get("Fatty acids, total saturated")),
            "sodium": _pos(nutrients.get("Sodium, Na")),
        })
    return results