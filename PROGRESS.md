# CookWise AI — Project Progress & Status Tracker

**Assignment:** RightSol AI Engineer Hiring Assignment  
**Deadline:** Tuesday, 17 November 2026, 6:00 PM IST  
**Current Date/Time:** Monday, 16 November 2026  
**Overall Status:** ~85% Completed (Development complete, APK build & final submission pending)

---

## 1. Executive Progress Summary

| Phase | Description | Status | Completion % |
|---|---|:---:|:---:|
| **Phase 0** | Workspace, Repo & Tooling Setup | ✅ Completed | 100% |
| **Phase 1** | FastAPI Backend & AI Services | ✅ Completed | 100% (Local) / Pending Deploy |
| **Phase 2** | CookWise AI Design System & Components | ✅ Completed | 100% |
| **Phase 3** | Mobile App Construction (Expo / React Native) | ✅ Completed | 100% |
| **Phase 4** | Distribution & Marketing Plan (Tier 1 Geos) | ✅ Completed | 100% |
| **Phase 5** | EAS Android APK Build & Device Testing | 🟡 Next Up | 20% (Config ready, build pending) |
| **Phase 6** | Drive Hosting & Google Form Submission | ⏳ Pending | 0% |
  
---

## 2. Detailed Breakdown by Component

### A. Backend (`backend/`) — 100% Functional Locally
- **Core Architecture:**
  - `app/main.py`: FastAPI server with global CORS middleware and `/health` route.
  - `app/core/config.py`: Configuration with Pydantic settings loading `.env`.
- **API Endpoints:**
  - `POST /ingredients/scan`: Vision endpoint handling multipart image uploads (JPEG, PNG, WebP) up to 8MB.
  - `POST /recipes/from-ingredients`: 3-recipe structured generation from user-confirmed ingredients.
  - `POST /recipes/generate`: Custom on-demand recipe generator with dietary/allergy filters.
  - `POST /meal-plan/generate`: 7-day budget meal plan with calorie targets and cost estimation.
  - `POST /grocery/generate`: Deterministic Python ingredient deduplication and unit converter (g/kg, ml/l).
- **Services & Data:**
  - `services/gemini_service.py`: Google Gemini API client with schema enforcement and error retry.
  - `services/vision_service.py`: Multimodal image processing.
  - `services/catalog.py` & `price_data.json`: Ingredient pricing dataset for budget calculation.
  - `services/units.py`: Deterministic ingredient normalization and unit converter.
- **Testing:**
  - 140 pytest unit test cases verifying grocery aggregation, data schemas, and API validation.

---

### B. Mobile Design System & Reusable Components (`mobile/src/`) — 100%
- **Locked Official Color Palette (`src/constants/colors.ts`):**
  - Primary: Forest Green (`#245C43`)
  - Backgrounds: Warm Ivory (`#FAF8F3`), Pure White (`#FFFFFF`), Sage Green (`#DCE9DD`)
  - Text: Charcoal (`#202820`), Muted Sage (`#858B82`)
  - Accent: Harvest Gold (`#E9A45B`)
  - Functional: Success (`#27845A`), Warning (`#D99A35`), Error (`#C94B4B`), Info (`#477FA8`)
- **Centralized Design Tokens (`src/constants/theme.ts`):**
  - Type scale (h1, h2, h3, body, caption, label), Spacing, Radius, and Shadows.
- **Component Kit:**
  - `PrimaryButton.tsx`: Full variant support (`primary`, `secondary`, `outline`, `ghost`) with inline spinner.
  - `RecipeCard.tsx`: Cuisine-based color banners, prep time, calorie tags, and favorites toggle.
  - `IngredientChip.tsx`: Interactive chips with remove buttons.
  - `LoadingState.tsx`, `EmptyState.tsx`, `ErrorState.tsx`: Standardized UX state handlers.

---

### C. Mobile Application Screens & Workflows (`mobile/app/`) — 100%
- **Navigation Shell:**
  - `app/_layout.tsx`: Root stack with TanStack QueryClient and Context AppProvider.
  - `app/(tabs)/_layout.tsx`: 5-tab bottom navigation with custom icons and theme tokens.
- **5 Bottom Tabs:**
  - `(tabs)/index.tsx`: Home screen with search, hero CTA, quick action shortcuts, and sample recipe carousel.
  - `(tabs)/scan.tsx`: Camera & gallery photo capture using `expo-image-picker` with instant image preview.
  - `(tabs)/plan.tsx`: Interactive weekly meal planner with day cards, calorie badges, and cost summaries.
  - `(tabs)/saved.tsx`: Bookmarked recipe library with real-time search and filter.
  - `(tabs)/profile.tsx`: Persistent dietary preferences, servings, and allergy tags.
- **Full Image-to-Recipe Stack Screens:**
  - `scan/confirm.tsx`: Editable ingredient chips showing Gemini Vision confidence tiers (High/Moderate/Low) with manual add/delete.
  - `scan/preferences.tsx`: Step to adjust cuisine, cooking time, servings, and dietary restrictions before AI generation.
  - `recipes/results.tsx`: Displays the 3 Gemini-generated recipes with notice banner and save button.
  - `recipes/details.tsx`: Full-screen recipe view with interactive ingredients checklist, step-by-step instructions, and macro nutrition cards.
  - `recipes/generator.tsx`: Independent manual AI recipe generation screen.
  - `plan/grocery.tsx`: Categorized grocery shopping checklist with "purchased" counter and progress bar.
- **Code Quality:**
  - Strict TypeScript check passed (`npx tsc --noEmit` exited with 0 errors).

---

### D. App Distribution & Marketing Plan (`MARKETING_PLAN.md`) — 100%
Comprehensive 5,000 Tier 1 install strategy document completed:
- **Target Geos:** US (50%), UK (20%), Canada (15%), Australia (15%).
- **Unit Economics ($7,800 Budget):**
  - Google App Campaigns (UAC): 1,200 installs at \$2.50 CPI.
  - Meta Video Ads: 750 installs at \$2.67 CPI.
  - TikTok Spark Ads: 650 installs at \$2.30 CPI.
  - Micro-Creator Seeding: 700 installs across 10 creators.
  - Organic (ASO, Viral Short-form, Reddit case studies, Programmatic SEO/AEO): 1,700 installs.
  - **Blended CPI:** \$1.56.
- **AEO & LLM Discoverability (Applying `SKILL.md`):**
  - Schema.org `Recipe` JSON-LD structured data.
  - Inverted-pyramid 40-word answer blocks for conversational AI search engines (Perplexity, ChatGPT, Claude).
  - Explicit `robots.txt` directives for AI search crawlers.

---

## 3. Remaining Tasks & Next Steps

1. **Deploy Backend to Public HTTPS Host:**
   - Deploy `backend/` to Render or Railway to obtain a public URL (required for Android APK builds to avoid plain HTTP blocking).
2. **Build Standalone Android APK:**
   - Update `mobile/eas.json` with the deployed backend URL.
   - Run `eas build -p android --profile preview` to generate the `.apk` file.
3. **Device Testing & Video Walkthrough:**
   - Install APK on a physical Android device to verify end-to-end flows.
   - Record a 2-minute backup demo video.
4. **Final Submission:**
   - Upload APK and Marketing Plan to Google Drive (Access: "Anyone with the link").
   - Submit via Google Form before the Tuesday 17 Nov, 6:00 PM IST deadline.
