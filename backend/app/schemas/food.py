from pydantic import BaseModel
from datetime import datetime

class FoodBase(BaseModel):
    name: str
    serving_size: float
    serving_unit: str
    default_serving_g: float | None = None
    default_serving_name: str | None = None
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
    magnesium: float | None = None
    iron: float | None = None
    zinc: float | None = None
    vitamin_d: float | None = None
    vitamin_c: float | None = None
    vitamin_a: float | None = None
    vitamin_b12: float | None = None
    folate: float | None = None
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

class FoodUpdate(BaseModel):
    """Fields a user may PATCH on their own food.

    Deliberately excludes id, user_id, source, external_id and created_at so a
    PATCH body cannot reassign ownership or provenance.
    """
    name: str | None = None
    serving_size: float | None = None
    serving_unit: str | None = None
    default_serving_g: float | None = None
    default_serving_name: str | None = None
    calories: float | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None
    fiber: float | None = None
    sugar: float | None = None
    saturated_fat: float | None = None
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
    is_public: bool | None = None
