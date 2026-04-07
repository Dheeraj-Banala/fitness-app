from pydantic import BaseModel
from datetime import datetime, date

class WorkoutSetBase(BaseModel):
    exercise_name: str
    set_number: int
    primary_muscle: str
    reps: int | None = None
    weight: float | None = None
    duration_seconds: int | None = None
    distance_km: float | None = None

class WorkoutSetCreate(WorkoutSetBase):
    pass

class WorkoutSetResponse(WorkoutSetBase):
    id: int
    workout_id: int

    class Config:
        from_attributes = True

class WorkoutBase(BaseModel):
    name: str | None = None
    notes: str | None = None
    date: date

class WorkoutCreate(WorkoutBase):
    exercises: list[WorkoutSetCreate]

class WorkoutResponse(WorkoutBase):
    id: int
    user_id: int
    created_at: datetime
    exercises: list[WorkoutSetResponse] = []

    class Config:
        from_attributes = True