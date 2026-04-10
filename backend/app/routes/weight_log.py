from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.weight_log import WeightLog
from ..schemas.weight_log import WeightLogCreate, WeightLogResponse
from ..auth import get_current_user

router = APIRouter(prefix="/weight-logs", tags=["weight logs"])

@router.post("/", response_model=WeightLogResponse)
def post_weight_log(log: WeightLogCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_log = WeightLog(**log.model_dump(), user_id=current_user.id)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/", response_model=list[WeightLogResponse])
def get_weight_logs(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(WeightLog).filter(WeightLog.user_id == current_user.id).all()

@router.delete("/{log_id}", )
def delete_weight_log(log_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_response = db.query(WeightLog).filter(WeightLog.id == log_id, WeightLog.user_id == current_user.id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Log not found")
    else:
        db.delete(db_response)
        db.commit()
    return {"message": "deleted"}