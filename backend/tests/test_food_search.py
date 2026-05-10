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


def test_usda_fallback_to_off(client):
    tokens = register_and_login(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    fake_result = [{"name": "Test Food", "calories": 0.04}]

    with patch("app.routes.food.search_usda", side_effect=Exception("USDA down")):
        with patch("app.routes.food.search_open_food_facts", return_value=fake_result):
            response = client.get("/foods/search/external?query=chicken", headers=headers)

    assert response.status_code == 200
    assert response.json() == fake_result
