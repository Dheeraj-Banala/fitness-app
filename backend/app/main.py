from fastapi import FastAPI
from .database import Base, engine
from .models import user, food, recipe, food_log, workout, water_log, weight_log, user_goals

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "ok"}

