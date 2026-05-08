import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/food_and_fitness").replace("postgres://", "postgresql://", 1)

exercises = [
    ("Bench Press", "Chest"),
    ("Incline Bench Press", "Chest"),
    ("Decline Bench Press", "Chest"),
    ("Dumbbell Fly", "Chest"),
    ("Cable Fly", "Chest"),
    ("Push Up", "Chest"),
    ("Deadlift", "Back"),
    ("Pull Up", "Back"),
    ("Chin Up", "Back"),
    ("Barbell Row", "Back"),
    ("Dumbbell Row", "Back"),
    ("Lat Pulldown", "Back"),
    ("Seated Cable Row", "Back"),
    ("T-Bar Row", "Back"),
    ("Overhead Press", "Shoulders"),
    ("Dumbbell Shoulder Press", "Shoulders"),
    ("Lateral Raise", "Shoulders"),
    ("Front Raise", "Shoulders"),
    ("Face Pull", "Shoulders"),
    ("Arnold Press", "Shoulders"),
    ("Squat", "Quads"),
    ("Front Squat", "Quads"),
    ("Leg Press", "Quads"),
    ("Leg Extension", "Quads"),
    ("Bulgarian Split Squat", "Quads"),
    ("Romanian Deadlift", "Hamstrings"),
    ("Leg Curl", "Hamstrings"),
    ("Good Morning", "Hamstrings"),
    ("Hip Thrust", "Glutes"),
    ("Glute Bridge", "Glutes"),
    ("Calf Raise", "Calves"),
    ("Seated Calf Raise", "Calves"),
    ("Barbell Curl", "Biceps"),
    ("Dumbbell Curl", "Biceps"),
    ("Hammer Curl", "Biceps"),
    ("Preacher Curl", "Biceps"),
    ("Cable Curl", "Biceps"),
    ("Tricep Pushdown", "Triceps"),
    ("Skull Crusher", "Triceps"),
    ("Overhead Tricep Extension", "Triceps"),
    ("Close Grip Bench Press", "Triceps"),
    ("Dips", "Triceps"),
    ("Plank", "Core"),
    ("Crunch", "Core"),
    ("Hanging Leg Raise", "Core"),
    ("Cable Crunch", "Core"),
    ("Ab Wheel Rollout", "Core"),
    ("Treadmill Run", "Cardio"),
    ("Cycling", "Cardio"),
    ("Rowing Machine", "Cardio"),
    ("Jump Rope", "Cardio"),
]

from app.database import Base
from app.models import user, food, recipe, food_log, workout, water_log, weight_log, user_goals, refresh_token, exercise

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
print("Tables created.")

with engine.connect() as conn:
    for name, muscle in exercises:
        conn.execute(text(
            "INSERT INTO exercises (name, primary_muscle, is_global) "
            "VALUES (:name, :muscle, true) "
            "ON CONFLICT DO NOTHING"
        ), {"name": name, "muscle": muscle})
    conn.commit()
    print(f"Seeded {len(exercises)} exercises.")
