from pydantic import BaseModel
from datetime import datetime, date

class WaterLogBase(BaseModel):
    amount_ml: float
    date: date

class WaterLogCreate(WaterLogBase):
    pass

class WaterLogResponse(WaterLogBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True