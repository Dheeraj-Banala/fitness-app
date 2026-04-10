from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.workout import Workout, WorkoutSet
from ..schemas.workout import WorkoutCreate, WorkoutResponse
from  ..auth import get_current_user

router = APIRouter(prefix="/workouts", tags=["workouts"])

@router.post("/", response_model=WorkoutResponse)
def post_workout_log(log: WorkoutCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_log = Workout(**log.model_dump(exclude={"sets"}), user_id=current_user.id)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    for exercise in log.sets:
        db.add(WorkoutSet(**exercise.model_dump(), workout_id=db_log.id))
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/", response_model=list[WorkoutResponse])
def get_workout_logs(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Workout).filter(Workout.user_id == current_user.id).all()

@router.delete("/{workout_id}")
def delete_workout_log(workout_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_response = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == current_user.id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Log not found")
    else:
        db.delete(db_response)
        db.commit()
    return {"message": "deleted"}