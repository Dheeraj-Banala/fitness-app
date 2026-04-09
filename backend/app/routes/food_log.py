from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.food_log import FoodLog
from ..schemas.food_log import FoodLogCreate, FoodLogResponse

router = APIRouter(prefix="/food-logs", tags=["food logs"])

@router.post("/", response_model=FoodLogResponse)
def post_food_log(log: FoodLogCreate, db: Session = Depends(get_db)):
    db_log = FoodLog(**log.model_dump(), user_id=1)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/", response_model=list[FoodLogResponse])
def get_food_logs(db: Session = Depends(get_db)):
    return db.query(FoodLog).filter(FoodLog.user_id == 1).all()

@router.delete("/{log_id}")
def delete_food_log(log_id: int, db: Session = Depends(get_db)):
    db_response = db.query(FoodLog).filter(FoodLog.id == log_id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Log not found")
    else:
        db.delete(db_response)
        db.commit()
    return {"message": "deleted"}