from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    height_cm: float | None = None
    weight_unit: str = 'lbs'
    volume_unit: str = 'oz'
    height_unit: str = 'ft_in'
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    height_cm: float | None = None
    weight_unit: str | None = None
    volume_unit: str | None = None
    height_unit: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str