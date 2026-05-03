from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Any
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.recipe import Recipe, RecipeIngredient
from ..models.food import Food
from ..schemas.recipe import RecipeCreate, RecipeResponse
from ..auth import get_current_user

router = APIRouter(prefix="/recipes", tags=["recipes"])

@router.post("/", response_model=RecipeResponse)
def post_recipe(log: RecipeCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_log = Recipe(**log.model_dump(exclude={"ingredients"}), user_id=current_user.id)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)

    calories = protein = carbs = fat = 0.0
    for ingredient in log.ingredients:
        db.add(RecipeIngredient(**ingredient.model_dump(), recipe_id=db_log.id))
        food = db.query(Food).filter(Food.id == ingredient.food_id).first()
        if food:
            calories += (food.calories or 0) * ingredient.quantity
            protein  += (food.protein  or 0) * ingredient.quantity
            carbs    += (food.carbs    or 0) * ingredient.quantity
            fat      += (food.fat      or 0) * ingredient.quantity

    db_log.calories = round(calories, 1)
    db_log.protein  = round(protein,  1)
    db_log.carbs    = round(carbs,    1)
    db_log.fat      = round(fat,      1)

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

@router.patch("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(recipe_id: int, data: dict[str, Any] = Body(...), current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id, Recipe.user_id == current_user.id).first()
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if "name" in data:
        recipe.name = data["name"]
    if "description" in data:
        recipe.description = data["description"]
    if "servings" in data:
        recipe.servings = data["servings"]

    if "ingredients" in data:
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe_id).delete()
        calories = protein = carbs = fat = 0.0
        for ing in data["ingredients"]:
            db.add(RecipeIngredient(recipe_id=recipe_id, food_id=ing["food_id"], quantity=ing["quantity"], unit=ing["unit"]))
            food = db.query(Food).filter(Food.id == ing["food_id"]).first()
            if food:
                calories += (food.calories or 0) * ing["quantity"]
                protein  += (food.protein  or 0) * ing["quantity"]
                carbs    += (food.carbs    or 0) * ing["quantity"]
                fat      += (food.fat      or 0) * ing["quantity"]
        recipe.calories = round(calories, 1)
        recipe.protein  = round(protein,  1)
        recipe.carbs    = round(carbs,    1)
        recipe.fat      = round(fat,      1)

    db.commit()
    db.refresh(recipe)
    return recipe

@router.delete("/{recipe_id}")
def delete_food(recipe_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_response = db.query(Recipe).filter(Recipe.id == recipe_id, Recipe.user_id == current_user.id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Log not found")
    else:
        db.delete(db_response)
        db.commit()
    return {"message": "deleted"}