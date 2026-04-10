from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user_goals import UserGoal
from ..schemas.user_goals import UserGoalCreate, UserGoalResponse
from ..auth import get_current_user

router = APIRouter(prefix="/goals", tags=["goals"])

@router.post("/", response_model=UserGoalResponse)
def post_user_goal(log: UserGoalCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_log = UserGoal(**log.model_dump(), user_id=current_user.id)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/", response_model=UserGoalResponse)
def get_user_goal(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_response = db.query(UserGoal).filter(UserGoal.user_id == current_user.id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Log not found")
    else:
        return db_response

@router.put("/", response_model=UserGoalResponse)
def put_user_goal(log: UserGoalCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_response = db.query(UserGoal).filter(UserGoal.user_id == current_user.id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Log not found")
    else:
        db_response.calories = log.calories
        db_response.carbs_g = log.carbs_g
        db_response.fat_g = log.fat_g
        db_response.protein_g = log.protein_g
        db_response.water_ml = log.water_ml
        db.commit()
        db.refresh(db_response)
        return db_response