from fastapi import APIRouter, HTTPException

from app.schemas.meal import GroceryList, GroceryRequest
from app.services import grocery_service

router = APIRouter(prefix="/grocery", tags=["grocery"])


@router.post("/generate", response_model=GroceryList)
def generate(req: GroceryRequest):
    ingredients = grocery_service.collect(req)
    if not ingredients:
        raise HTTPException(422, "Provide ingredients, a plan or recipes")
    items = grocery_service.build_grocery_list(ingredients, req.have)
    return GroceryList(total_items=len(items), items=items)
