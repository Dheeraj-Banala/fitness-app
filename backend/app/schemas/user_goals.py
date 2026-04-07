from pydantic import BaseModel
from datetime import datetime

class UserGoalBase(BaseModel):
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    water_ml: float | None = None

class UserGoalCreate(UserGoalBase):
    pass

class UserGoalResponse(UserGoalBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True