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

def test_create_workout_with_sets(client):
    tokens = register_and_login(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    response = client.post("/workouts/", json={
        "name": "Push Day",
        "date": "2026-01-01",
        "sets": [
            {"exercise_name": "Bench Press", "set_number": 1, "primary_muscle": "Chest", "reps": 8, "weight": 135.0},
            {"exercise_name": "Bench Press", "set_number": 2, "primary_muscle": "Chest", "reps": 6, "weight": 145.0},
        ]
    }, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Push Day"
    assert len(data["sets"]) == 2

def test_delete_workout_cascades_sets(client):
    tokens = register_and_login(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    workout = client.post("/workouts/", json={
        "name": "Push Day",
        "date": "2026-01-01",
        "sets": [
            {"exercise_name": "Bench Press", "set_number": 1, "primary_muscle": "Chest", "reps": 8, "weight": 135.0},
        ]
    }, headers=headers).json()

    client.delete(f"/workouts/{workout['id']}", headers=headers)

    workouts = client.get("/workouts/", headers=headers).json()
    assert len(workouts) == 0