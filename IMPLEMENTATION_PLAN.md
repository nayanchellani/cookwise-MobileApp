# Implementation Plan: AI Recipe App (working name: FridgeChef)

Deadline: Tue 17 Nov 2026, 6:00 PM IST. Target: APK done Mon night, submit Tue by 3 PM.
Distribution is by APK link only. No Play Console account is needed.

## 0. Scope

Build:
1. AI Recipe Generator
2. What's in My Fridge (photo -> ingredients -> recipes)
3. AI Meal Planner (7 days, budget, estimated cost)
4. Recipe Library (save, search, filter, collections)
5. Smart Grocery List (pure Python, no LLM)

Deliberate cuts (list these in the README):
- No `users.py`, no `models/`, no database, no login. Saved recipes, collections, diet and allergies live on the device (AsyncStorage).
- Onboarding is one welcome screen.
- Home "featured recipes" is a hardcoded JSON file.
- Recipe images are emoji/gradient placeholders chosen by cuisine.
- Collections are a `collection` field on each saved recipe.
- Gemini API key lives only on the server.

## 1. Stack

| Layer | Choice |
|---|---|
| Mobile | Expo (React Native, TypeScript), `expo-router` tabs, plain `StyleSheet` |
| Device storage | `@react-native-async-storage/async-storage` |
| Camera | `expo-image-picker` (`launchCameraAsync`) |
| Backend | FastAPI, `google-genai`, Pydantic, `pydantic-settings`, `python-multipart` |
| Tests | `pytest` (grocery merge only) |
| Backend host | Render free web service (HTTPS) |
| APK | EAS Build cloud, `buildType: apk` |

## 2. Repo layout

```
ProgrammingHub assignment/
  backend/
    app/
      main.py
      core/config.py
      schemas/recipe.py
      schemas/meal.py
      services/gemini_service.py
      services/recipe_service.py
      services/vision_service.py
      services/meal_service.py
      services/grocery_service.py
      services/price_data.json
      api/recipes.py
      api/ingredients.py
      api/meal_planner.py
      api/grocery.py
    tests/test_grocery.py
    requirements.txt
    .env              (never commit)
  mobile/             (Expo app)
  README.md
```

## 3. Phase 0: Setup (Sun night, about 2h)

1. Install Node LTS, Python 3.12, Git, VS Code.
2. Install Expo Go on your Android phone.
3. Create accounts: expo.dev, render.com, github.com.
4. Create a Gemini API key at aistudio.google.com. Check the current Flash model name there.
5. `git init` in the project folder and add a `.gitignore` with `.env`, `.venv`, `node_modules`.
6. Backend env:
   ```
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install fastapi "uvicorn[standard]" google-genai pydantic-settings python-multipart pytest httpx
   pip freeze > requirements.txt
   ```
7. Mobile app: `npx create-expo-app@latest mobile` then `cd mobile` then `npx expo start`. Scan the QR code with Expo Go.

Done when: the starter app opens on your phone and `uvicorn` starts with no errors.

## 4. Phase 1: Backend (Sun night to Mon midday, about 5h)

Work in this order. Test each step in the browser at `http://127.0.0.1:8000/docs`.

### 4.1 Foundation
- `core/config.py`: `Settings(BaseSettings)` with `gemini_api_key`, `gemini_model`. Reads `.env`.
- `main.py`: create `FastAPI()`, add CORS (allow all origins for the demo), include the four routers, add `GET /health` returning `{"ok": true}`.

### 4.2 Schemas (`schemas/recipe.py`, `schemas/meal.py`)
- `Ingredient`: name, quantity (float), unit (str).
- `Macros`: protein_g, carbs_g, fat_g.
- `Recipe`: name, description, cuisine, diet, prep_min, cook_min, difficulty, servings, ingredients[], steps[], calories, macros, labels[].
- `RecipeList`: recipes[].
- `RecipeRequest`: ingredients[], cuisine, diet, max_time_min, difficulty, servings (1-6), allergies[].
- `MealPlanRequest`: days, budget, diet, meals[], servings (1-4), country, allergies[].
- `Meal`: name, calories, ingredients[].
- `DayPlan`: day (int), meals dict mapping slot to `Meal`, plus computed `est_cost` and `calories`.
- `MealPlan`: days[], total_est_cost, budget, over_budget (bool).
- `GroceryRequest`: plan or recipes (list of ingredient lists), have[] (names already owned).
- `GroceryItem`: name, quantity, unit, category, purchased (false).

### 4.3 `services/gemini_service.py` (the only file that talks to Gemini)
- `client = genai.Client(api_key=settings.gemini_api_key)`.
- `generate_structured(prompt, schema, image_bytes=None, mime=None)`:
  - contents = `[types.Part.from_bytes(data=..., mime_type=...), prompt]` if an image is given, else `[prompt]`.
  - `config={"response_mime_type": "application/json", "response_schema": schema}`.
  - Return `response.parsed`. If it is `None` or validation fails, retry once, then raise `HTTPException(502, "AI returned invalid data")`.

### 4.4 Feature endpoints
| Step | Endpoint | Service logic |
|---|---|---|
| 1 | `POST /recipes/generate` | Build prompt from `RecipeRequest` (include allergies as hard exclusions). Return `Recipe`. |
| 2 | `POST /ingredients/detect` | Multipart `image`. Reject non-image or over 6 MB. Prompt: "List edible ingredients visible. Return only names." Schema: `{ingredients: list[str]}`. |
| 3 | `POST /recipes/from-ingredients` | Confirmed ingredient list in, 3-5 `Recipe`s out (schema `RecipeList`). |
| 4 | `POST /meal-plan/generate` | One Gemini call returns days x meals with ingredient quantities and calories. Python then fills `est_cost` per meal from `price_data.json`. Unknown ingredient: use a default price. Set `over_budget`. |
| 5 | `POST /grocery/generate` | `grocery_service.py`, pure Python. See 4.5. |

`price_data.json` format: `{"US": {"tomato": {"unit": "kg", "price": 3.5}, ...}, "GB": {...}}`. Cover about 40 common ingredients for US only at first. Label costs "estimated" in the UI.

### 4.5 `grocery_service.py` (no LLM)
1. Normalize name: lowercase, strip, naive singular (`tomatoes` -> `tomato`, `eggs` -> `egg`), drop adjectives list (`fresh`, `chopped`, `large`).
2. Normalize units: `g/kg` -> grams, `ml/l` -> ml, `pcs/piece/whole` -> pcs. Unknown units stay as-is and merge only with the same unit.
3. Sum quantities per (name, base unit). Convert back: >= 1000 g -> kg, >= 1000 ml -> l.
4. Drop any item whose name is in `have`.
5. Assign category via a dict (Vegetables, Fruits, Dairy & Eggs, Meat & Fish, Grains & Pasta, Pantry, Spices, Other).
6. Return items sorted by category, then name.

`tests/test_grocery.py` cases:
- `tomatoes 2 pcs` + `tomato 4 pcs` -> `tomato 6 pcs`.
- `rice 500 g` + `rice 1.5 kg` -> `rice 2 kg`.
- An item in `have` is excluded.

### 4.6 Deploy (end of Phase 1)
1. Push to GitHub.
2. Render: new Web Service, root dir `backend`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. Set env vars `GEMINI_API_KEY` and `GEMINI_MODEL`.
4. Open `https://<service>.onrender.com/docs` and run each endpoint once.

Done when: all 5 endpoints return valid JSON from the deployed URL, and `pytest` passes.

## 5. Phase 2: Mobile (Mon, about 10h)

Method: one prompt to Claude Code per step. Each prompt names the screen, the endpoint, the response shape, and the "done when" check. Run on your phone after every step. Do not start the next step until the current one works.

Setup before step 1:
```
cd mobile
npx expo install expo-image-picker @react-native-async-storage/async-storage
```
Create `.env` in `mobile/` with `EXPO_PUBLIC_API_URL=https://<service>.onrender.com`. Build `lib/api.ts` (typed `fetch` wrappers) and `lib/types.ts` (mirror the backend schemas).

| Step | Build | Done when |
|---|---|---|
| 1 | 5-tab shell: Home, Scan, Plan, Saved, Profile. Welcome screen shown on first launch. | Tabs switch on phone. |
| 2 | `RecipesContext` backed by AsyncStorage: `saved[]`, `history[]`, `save`, `unsave`, `setCollection`. Wrap the app. | Saved data survives an app restart. |
| 3 | Recipe generator form (ingredient chips, cuisine, diet, time 15/30/45/60, difficulty, servings 1-6) -> `POST /recipes/generate` -> Recipe details screen (placeholder image, times, ingredients, steps, macros, labels, Save button). | A generated recipe appears and saves. |
| 4 | Scan tab: `launchCameraAsync` (quality 0.5) -> preview -> upload via `FormData` -> detected chips (remove, add) -> "Find Recipes" -> results list -> details. | Fridge photo yields confirmed chips and 3-5 recipes. |
| 5 | Saved tab: search box, filters (cuisine, diet, time), collection picker (Breakfast, Lunch, Dinner, Favorites), "Recently generated" section. | Search and filters work. |
| 6 | Plan tab: form (days, budget 50/75/100, diet, meals, servings) -> `POST /meal-plan/generate` -> day cards (meals, calories, est. cost), total vs budget, "estimated" label. | Plan renders for 7 days. |
| 7 | Grocery screen: "Generate Grocery List" from the plan, "I already have" toggle per item, grouped by category, checkboxes, "0 of N purchased". | Duplicates merged, checks persist. |
| 8 | Profile: diet and allergies saved on device, sent with every AI request. | Allergy excluded from output. |
| 9 | Home: greeting, search, 6 hardcoded featured recipes, quick-action buttons to generator, scan, plan. | Quick actions navigate. |
| 10 | Polish: loading spinners, error messages ("AI is slow, retry"), empty states, app name, icon, splash in `app.json`. | No blank or crashing screens. |

Rules for every screen: show a spinner during calls, show a retry on failure, never crash on an empty response. The first call may take about 50 s if Render was asleep, so show "Waking up server...".

Cut list if time runs out (cut in this order): Home polish, history section, collections, filters. Never cut Scan or Recipe Generator.

## 6. Phase 3: APK (Mon night, about 2h)

1. In `app.json` set `expo.android.package` (for example `com.yourname.fridgechef`) and `expo.name`.
2. `npm i -g eas-cli`, `eas login`, `eas build:configure`.
3. In `eas.json`:
   ```json
   {
     "build": {
       "preview": {
         "distribution": "internal",
         "android": { "buildType": "apk" },
         "env": { "EXPO_PUBLIC_API_URL": "https://<service>.onrender.com" }
       }
     }
   }
   ```
4. `eas build -p android --profile preview`. Download the APK when it finishes.
5. Install it on a real phone. Run all 5 features against the deployed backend. Fix bugs, rebuild if needed (each build takes about 10-20 min, so budget for two).
6. Upload the APK to Google Drive, set General access to "Anyone with the link". Test the link in an incognito window.
7. Record a 2-minute screen demo (Scan -> recipes -> save -> plan -> grocery) as a fallback. Put it in the same Drive folder.

## 7. Phase 4: Submission (Tue morning)

1. Reply to the assignment email confirming acceptance (do this tonight).
2. Write `README.md`: what the app does, architecture, how to run backend, cuts made, known limits.
3. Add the APK link and the marketing plan link to the Google Form.
4. Share both links with Azar and Salma.
5. Open both links in incognito to confirm.

## 8. Timeline

| When (IST) | Work |
|---|---|
| Sun evening | Phase 0, reply to email |
| Sun night | Backend 4.1-4.3, endpoints 1-2 |
| Mon morning | Endpoints 3-5, tests, deploy |
| Mon midday-evening | Mobile steps 1-7 |
| Mon night | Steps 8-10, APK build, device test |
| Tue morning | Fix bugs, final APK, marketing plan, README |
| Tue by 3 PM | Submit (3-hour buffer before 6 PM) |

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Render free tier sleeps about 50 s | "Waking up server" message. Ping `/health` before demos. Tell reviewers. |
| Gemini free-tier rate limits | Do not spam-test. Retry once on error. |
| Gemini returns invalid JSON | `response_schema` plus one retry, then a clear 502. |
| Vision misidentifies items | User confirms and edits chips before recipe generation. |
| Android blocks `http` in release builds | Always use the Render `https` URL in the APK. |
| API key leak | Key only in Render env and local `.env`, never in the app or git. |
| Build fails late | Run the first EAS build by Mon midday with the shell app to catch config errors early. |
