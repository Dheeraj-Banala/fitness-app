from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    height_cm = Column(Float, nullable=True)
    weight_unit = Column(String, nullable=False, default='lbs')
    volume_unit = Column(String, nullable=False, default='oz')
    height_unit = Column(String, nullable=False, default='ft_in')
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    