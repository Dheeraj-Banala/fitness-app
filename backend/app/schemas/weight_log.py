from pydantic import BaseModel
from datetime import datetime, date

class WeightLogBase(BaseModel):
    weight_kg: float
    notes: str | None = None
    date: date

class WeightLogCreate(WeightLogBase):
    pass

class WeightLogResponse(WeightLogBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True