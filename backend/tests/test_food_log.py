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

def test_food_log_scaling(client):
    tokens = register_and_login(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # Create a food: 4 calories per gram (stored per 1g in DB)
    food = client.post("/foods/", json={
        "name": "Test Food",
        "calories": 4.0,
        "protein": 0.0,
        "carbs": 1.0,
        "fat": 0.0,
        "serving_size": 100,
        "serving_unit": "g",
        "is_public": False,
    }, headers=headers).json()

    # Log 200g of it
    client.post("/food-logs/", json={
        "food_id": food["id"],
        "meal_type": "breakfast",
        "quantity": 200,
        "unit": "g",
        "date": "2026-01-01"
    }, headers=headers)

    logs = client.get("/food-logs/", headers=headers).json()
    assert len(logs) == 1
    # 4 cal/g * 200g = 800 cal
    assert logs[0]["food"]["calories"] == 4.0
    assert logs[0]["quantity"] == 200

def test_food_log_scaling_math(client):
    tokens = register_and_login(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # 4 calories per gram stored in DB
    food = client.post("/foods/", json={
        "name": "Test Food",
        "calories": 4.0,
        "protein": 1.0,
        "carbs": 0.5,
        "fat": 0.1,
        "serving_size": 100,
        "serving_unit": "g",
        "is_public": False,
    }, headers=headers).json()

    client.post("/food-logs/", json={
        "food_id": food["id"],
        "meal_type": "breakfast",
        "quantity": 250,
        "unit": "g",
        "date": "2026-01-01"
    }, headers=headers)

    log = client.get("/food-logs/", headers=headers).json()[0]
    scale = log["quantity"]  # unit is 'g', so scale = qty
    assert round(log["food"]["calories"] * scale) == 1000  # 4 * 250
    assert round(log["food"]["protein"] * scale) == 250   # 1 * 250
    assert round(log["food"]["carbs"] * scale) == 125     # 0.5 * 250

def test_patch_food(client):
    tokens = register_and_login(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    food = client.post("/foods/", json={
        "name": "Original Name",
        "calories": 4.0,
        "protein": 1.0,
        "carbs": 0.5,
        "fat": 0.1,
        "serving_size": 100,
        "serving_unit": "g",
        "is_public": False,
    }, headers=headers).json()

    updated = client.patch(f"/foods/{food['id']}", json={
        "name": "Updated Name",
        "calories": 2.0,
    }, headers=headers).json()

    assert updated["name"] == "Updated Name"
    assert updated["calories"] == 2.0
