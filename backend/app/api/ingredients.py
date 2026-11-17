from fastapi import APIRouter, File, UploadFile

from app.schemas.recipe import IngredientNames
from app.services import vision_service
from app.services.image_service import MAX_BYTES

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.post(
    "/scan",
    response_model=IngredientNames,
    summary="Detect ingredients in a photo",
    description=(
        "Multipart field `image` (JPEG, PNG or WebP, up to 8 MB). Results are unconfirmed suggestions: "
        "the client must let the user review and edit them before calling /recipes/from-ingredients."
    ),
)
def scan(image: UploadFile = File(...)):
    # Read at most one byte past the limit so oversized uploads are rejected without buffering them all.
    data = image.file.read(MAX_BYTES + 1)
    return IngredientNames(ingredients=vision_service.scan_ingredients(data))
