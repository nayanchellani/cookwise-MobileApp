import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import grocery, ingredients, meal_planner, recipes

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="FridgeChef API")

# shortcut: open CORS for the prototype, restrict origins if a web client is ever added
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

for module in (recipes, ingredients, meal_planner, grocery):
    app.include_router(module.router)


@app.get("/health")
def health():
    return {"ok": True}
