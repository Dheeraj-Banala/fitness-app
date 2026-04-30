from pydantic import BaseModel
from datetime import datetime, date

class FoodLogBase(BaseModel):
    meal_type: str
    quantity: float
    unit: str
    date: date
    food_id: int | None = None
    recipe_id: int | None = None

class FoodSummary(BaseModel):
    id: int
    name: str
    calories: float | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None
    fiber: float | None = None
    sodium: float | None = None
    potassium: float | None = None
    calcium: float | None = None
    magnesium: float | None = None
    iron: float | None = None
    zinc: float | None = None
    vitamin_d: float | None = None
    vitamin_c: float | None = None
    vitamin_a: float | None = None
    vitamin_b12: float | None = None
    folate: float | None = None

    class Config:
        from_attributes = True

class RecipeSummary(BaseModel):
    id: int
    name: str
    servings: float
    calories: float | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None

    class Config:
        from_attributes = True

class FoodLogCreate(FoodLogBase):
    pass

class FoodLogResponse(FoodLogBase):
    id: int
    user_id: int
    created_at: datetime
    food: FoodSummary | None = None
    recipe: RecipeSummary | None = None

    class Config:
        from_attributes = True