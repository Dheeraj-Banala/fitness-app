from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.water_log import WaterLog
from ..schemas.water_log import WaterLogCreate, WaterLogResponse
from ..auth import get_current_user

router = APIRouter(prefix="/water-logs", tags=["water logs"])

@router.post("/", response_model=WaterLogResponse)
def post_water_log(log: WaterLogCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_log = WaterLog(**log.model_dump(), user_id=current_user.id)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/", response_model=list[WaterLogResponse])
def get_water_logs(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(WaterLog).filter(WaterLog.user_id == current_user.id).all()

@router.delete("/{log_id}")
def delete_water_log(log_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_response = db.query(WaterLog).filter(WaterLog.id == log_id, WaterLog.user_id == current_user.id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Log not found")
    else:
        db.delete(db_response)
        db.commit()
    return {"message": "deleted"}