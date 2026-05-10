from unittest.mock import patch

def register_and_login(client):
    client.post("/users/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })
    return client.post("/users/login", json={
        "email": "test@example.com",
        "password": "password123"
    }).json()


def create_food(client, headers):
    return client.post("/foods/", json={
        "name": "Test Ingredient",
        "calories": 4.0,
        "protein": 1.0,
        "carbs": 0.5,
        "fat": 0.1,
        "serving_size": 100,
        "serving_unit": "g",
        "is_public": False,
    }, headers=headers).json()


def test_recipe_macro_calculation(client):
    tokens = register_and_login(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    food = create_food(client, headers)

    # 200g of food: calories=4*200=800, protein=1*200=200
    recipe = client.post("/recipes/", json={
        "name": "Test Recipe",
        "servings": 1,
        "ingredients": [
            {"food_id": food["id"], "quantity": 200, "unit": "g"}
        ]
    }, headers=headers).json()

    assert recipe["calories"] == 800.0
    assert recipe["protein"] == 200.0
    assert recipe["carbs"] == 100.0
    assert recipe["fat"] == 20.0


def test_patch_recipe_recalculates_macros(client):
    tokens = register_and_login(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    food = create_food(client, headers)

    recipe = client.post("/recipes/", json={
        "name": "Test Recipe",
        "servings": 1,
        "ingredients": [
            {"food_id": food["id"], "quantity": 200, "unit": "g"}
        ]
    }, headers=headers).json()

    # Update to 100g — macros should halve
    updated = client.patch(f"/recipes/{recipe['id']}", json={
        "ingredients": [
            {"food_id": food["id"], "quantity": 100, "unit": "g"}
        ]
    }, headers=headers).json()

    assert updated["calories"] == 400.0
    assert updated["protein"] == 100.0


def test_patch_recipe_name(client):
    tokens = register_and_login(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    food = create_food(client, headers)

    recipe = client.post("/recipes/", json={
        "name": "Old Name",
        "servings": 1,
        "ingredients": [
            {"food_id": food["id"], "quantity": 100, "unit": "g"}
        ]
    }, headers=headers).json()

    updated = client.patch(f"/recipes/{recipe['id']}", json={
        "name": "New Name"
    }, headers=headers).json()

    assert updated["name"] == "New Name"
