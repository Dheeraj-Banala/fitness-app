from pydantic import BaseModel

class ExerciseCreate(BaseModel):
    name: str
    primary_muscle: str

class ExerciseResponse(BaseModel):
    id: int
    name: str
    primary_muscle: str
    is_global: bool
    user_id: int | None = None

    class Config:
        from_attributes = True
