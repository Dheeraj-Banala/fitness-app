from pydantic import BaseModel
from datetime import datetime

class RecipeIngredientBase(BaseModel):
    food_id: int
    quantity: float
    unit: str

class RecipeIngredientCreate(RecipeIngredientBase):
    pass

class RecipeIngredientResponse(RecipeIngredientBase):
    id: int
    recipe_id: int

    class Config:
        from_attributes = True

class RecipeBase(BaseModel):
    name: str
    description: str | None = None
    servings: float = 1

class RecipeCreate(RecipeBase):
    ingredients: list[RecipeIngredientCreate]

class RecipeResponse(RecipeBase):
    id: int
    user_id: int
    created_at: datetime
    ingredients: list[RecipeIngredientResponse] = []
    calories: float | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None

    class Config:
        from_attributes = True

