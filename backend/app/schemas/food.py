from pydantic import BaseModel
from datetime import datetime

class FoodBase(BaseModel):
    name: str
    serving_size: float
    serving_unit: str
    calories: float
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None
    fiber: float | None = None
    sugar: float | None = None
    saturated_fat: float | None = None
    sodium: float | None = None
    potassium: float | None = None
    calcium: float | None = None
    iron: float | None = None
    is_public: bool = True

class FoodCreate(FoodBase):
    source: str = "user"
    external_id: str | None = None

class FoodResponse(FoodBase):
    id: int
    user_id: int | None = None
    source: str
    external_id: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True