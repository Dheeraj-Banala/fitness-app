from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from ..database import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    primary_muscle = Column(String, nullable=False)
    is_global = Column(Boolean, nullable=False, default=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
