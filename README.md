# CookWise AI — Full Stack Mobile Prototype & Submission

> **Hiring Assignment for RightSol**  
> **Candidate Implementation Overview**

CookWise AI is an AI-powered personal kitchen assistant built using a **FastAPI (Python 3.12) backend** and an **Expo (React Native, TypeScript) mobile application**.

---

## 1. System Architecture

```
ProgrammingHub assignment/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app + CORS configuration
│   │   ├── core/config.py             # Environment configuration (Pydantic Settings)
│   │   ├── schemas/                   # Pydantic schemas (Recipe, Meal, Grocery, Vision)
│   │   ├── services/                  # Gemini AI client, Vision service, Deterministic Grocery
│   │   └── api/                       # Modular endpoints (/recipes, /ingredients, /meal-plan, /grocery)
│   ├── tests/                         # Pytest test suite (grocery deduplication, validation, etc.)
│   ├── requirements.txt
│   └── .env.example
├── mobile/                            # Expo React Native App
│   ├── app/                           # Expo Router navigation (Tabs & stack screens)
│   │   ├── (tabs)/                    # Home, Scan, Plan, Saved, Profile
│   │   ├── scan/                      # Image confirmation & preference selection
│   │   ├── recipes/                   # AI Recipe results & detailed view
│   │   └── plan/                      # Smart grocery list view
│   ├── src/
│   │   ├── constants/colors.ts        # Official CookWise AI locked color palette
│   │   ├── constants/theme.ts         # Centralized design tokens (typography, spacing, shadows)
│   │   ├── api/                       # Typed Axios API clients matching FastAPI contracts
│   │   ├── components/                # Reusable UI tokens (Buttons, Cards, Chips, States)
│   │   ├── store/                     # Context-based reactive workflow store
│   │   └── types/                     # TypeScript schemas matching backend Pydantic models
│   ├── app.json                       # Android configuration & camera permissions
│   ├── eas.json                       # EAS Build profile for standalone Android APK compilation
│   └── package.json
├── MARKETING_PLAN.md                  # Comprehensive Tier 1 Go-To-Market & Install Strategy
└── README.md
```

---

## 2. Official Design System (CookWise AI)

- **Primary:** Forest Green (`#245C43`) — CTAs, active highlights, navigation.
- **Backgrounds:** Warm Ivory (`#FAF8F3`) as default, Pure White (`#FFFFFF`) for cards, Sage Green (`#DCE9DD`) for chips.
- **Text:** Charcoal (`#202820`) for headings & body, Muted Sage (`#858B82`) for secondary labels.
- **Accent:** Harvest Gold (`#E9A45B`).
- **Functional:** Success (`#27845A`), Warning (`#D99A35`), Error (`#C94B4B`).

---

## 3. How to Run Locally

### Backend
1. Open terminal in `backend/`:
   ```bash
   cd backend
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Create `.env` file with your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. Start the API server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
4. Test the API docs in your browser: `http://localhost:8000/docs`

### Mobile App (Expo)
1. Open terminal in `mobile/`:
   ```bash
   cd mobile
   npm install
   ```
2. Set backend API target in `mobile/.env` (optional, defaults to emulator `http://10.0.2.2:8000` or custom HTTPS URL):
   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:8000
   ```
3. Start Expo:
   ```bash
   npx expo start
   ```
4. Open **Expo Go** on your Android device and scan the displayed QR code.

---

## 4. Building Standalone Android APK

An `eas.json` configuration is pre-configured with the `preview` profile:
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
This builds an installable `.apk` file via Expo Application Services without needing local Android Studio/SDK setup.

---

## 5. Deliberate Architectural Decisions & Cuts

- **On-Device Persistence:** To maintain privacy, fast offline access, and minimal backend bloat, user favorites and dietary settings live in the mobile store rather than an unauthenticated database.
- **Deterministic Grocery Aggregator:** Combining ingredients (e.g. `2 tomatoes` + `4 tomatoes` = `6 tomatoes`, unit conversions `g` to `kg`) runs deterministically in clean Python code instead of costly non-deterministic LLM tokens.
- **Human-in-the-loop Vision Pipeline:** Ingredient scan results from Gemini Vision are presented as editable chips so users can correct or supplement items before triggering recipe generation.
