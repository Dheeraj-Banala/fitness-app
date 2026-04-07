from pydantic import BaseModel
from datetime import datetime, date

class FoodLogBase(BaseModel):
    meal_type: str
    quantity: float
    unit: str
    date: date
    food_id: int | None = None
    recipe_id: int | None = None

class FoodLogCreate(FoodLogBase):
    pass

class FoodLogResponse(FoodLogBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True