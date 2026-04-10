from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.recipe import Recipe, RecipeIngredient
from ..schemas.recipe import RecipeCreate, RecipeResponse
from ..auth import get_current_user

router = APIRouter(prefix="/recipes", tags=["recipes"])

@router.post("/", response_model=RecipeResponse)
def post_recipe(log: RecipeCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_log = Recipe(**log.model_dump(exclude={"ingredients"}), user_id=current_user.id)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    for ingredient in log.ingredients:
        db.add(RecipeIngredient(**ingredient.model_dump(), recipe_id=db_log.id))
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/", response_model=list[RecipeResponse])
def get_recipes(search: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Recipe)
    if search:
        query = query.filter(Recipe.name.ilike(f"%{search}%"))
    return query.all()

@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe_by_id(recipe_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_response = db.query(Recipe).filter(Recipe.id == recipe_id, Recipe.user_id == current_user.id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Food not found")
    return db_response

@router.delete("/{recipe_id}")
def delete_food(recipe_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_response = db.query(Recipe).filter(Recipe.id == recipe_id, Recipe.user_id == current_user.id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Log not found")
    else:
        db.delete(db_response)
        db.commit()
    return {"message": "deleted"}