from fastapi import FastAPI
from .database import Base, engine
from .models import user, food, recipe, food_log, workout, water_log, weight_log, user_goals
from .routes import weight_log as weight_log_router
from .routes import water_log as water_log_router
from .routes import food_log as food_log_router
from .routes import workout as workout_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(weight_log_router.router)
app.include_router(water_log_router.router)
app.include_router(food_log_router.router)
app.include_router(workout_router.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

