from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Any
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.food import Food
from ..schemas.food import FoodCreate, FoodResponse
from ..auth import get_current_user
from ..services.food_api import search_open_food_facts, search_usda

router = APIRouter(prefix="/foods", tags=["foods"])

@router.post("/", response_model=FoodResponse)
def post_food(log: FoodCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_log = Food(**log.model_dump(), user_id=current_user.id)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/", response_model=list[FoodResponse])
def get_foods(search: str | None = None, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Food).filter(Food.is_public == True)
    if search:
        query = query.filter(Food.name.ilike(f"%{search}%"))
    return query.all()

@router.get("/mine", response_model=list[FoodResponse])
def get_my_foods(search: str | None = None, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Food).filter(Food.user_id == current_user.id, Food.source == 'user')
    if search:
        query = query.filter(Food.name.ilike(f"%{search}%"))
    return query.all()

@router.get("/search/external")
def search_external_foods(query: str, current_user = Depends(get_current_user)):
    try:
        return search_usda(query)
    except Exception:
        return search_open_food_facts(query)

@router.patch("/{food_id}", response_model=FoodResponse)
def update_food(food_id: int, updates: dict[str, Any] = Body(...), current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.id == food_id, Food.user_id == current_user.id).first()
    if food is None:
        raise HTTPException(status_code=404, detail="Food not found")
    for key, value in updates.items():
        if hasattr(food, key):
            setattr(food, key, value)
    db.commit()
    db.refresh(food)
    return food

@router.get("/{food_id}", response_model=FoodResponse)
def get_food_by_id(food_id: int, db: Session = Depends(get_db)):
    db_response = db.query(Food).filter(Food.id == food_id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Food not found")
    return db_response

@router.delete("/{food_id}")
def delete_food(food_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_response = db.query(Food).filter(Food.id == food_id, Food.user_id == current_user.id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Log not found")
    else:
        db.delete(db_response)
        db.commit()
    return {"message": "deleted"}

@router.get("/barcode/{barcode}")
def lookup_food_by_barcode(barcode: str):
    from ..services.food_api import lookup_barcode
    result = lookup_barcode(barcode)
    if result is None:
        raise HTTPException(status_code=404, detail="Barcode not found")
    return result