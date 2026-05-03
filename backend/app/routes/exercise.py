from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.exercise import Exercise
from ..schemas.exercise import ExerciseCreate, ExerciseResponse
from ..auth import get_current_user

router = APIRouter(prefix="/exercises", tags=["exercises"])

@router.get("/", response_model=list[ExerciseResponse])
def search_exercises(
    q: str = Query(default=""),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Exercise).filter(
        (Exercise.is_global == True) | (Exercise.user_id == current_user.id)
    )
    if q:
        query = query.filter(Exercise.name.ilike(f"%{q}%"))
    return query.order_by(Exercise.name).limit(30).all()

@router.post("/", response_model=ExerciseResponse)
def create_exercise(
    exercise: ExerciseCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_exercise = Exercise(
        name=exercise.name,
        primary_muscle=exercise.primary_muscle,
        is_global=False,
        user_id=current_user.id,
    )
    db.add(db_exercise)
    db.commit()
    db.refresh(db_exercise)
    return db_exercise
