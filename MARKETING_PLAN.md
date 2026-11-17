# CookWise AI — Marketing Plan & Distribution Strategy
**Target:** 5,000 Installs from Tier 1 Countries (US, UK, CA, AU) within 30 Days  
**Submission for:** RightSol AI Engineer Assignment  
**Product:** CookWise AI (Mobile App — React Native/Expo)

---

## 1. Executive Summary & Value Proposition

CookWise AI is an AI-powered kitchen co-pilot that stops food waste and saves money by transforming raw fridge photos into personalized, budget-conscious recipes and automated shopping lists in under 60 seconds.

### The Problem in Tier 1 Markets
- **Food Waste & Inflation:** The average American household wastes \$1,500+ worth of groceries each year amidst rising food inflation.
- **Decision Fatigue:** Consumers experience daily friction deciding what to cook with random leftover ingredients.
- **Fragmented Solutions:** Existing apps either handle recipe catalogs (Recime, Flavorish) or grocery checklists, but none connect **Computer Vision Fridge Scanning → Deterministic Cost Estimation → Smart Categorized Grocery Deduplication** in one seamless mobile workflow.

### The Hook & Positioning
> **"Scan your fridge, eliminate food waste, eat delicious meals for under \$5."**

---

## 2. Target Audience & Tier 1 Geos

### Geographic Focus
- **United States:** 50% (2,500 installs)
- **United Kingdom:** 20% (1,000 installs)
- **Canada:** 15% (750 installs)
- **Australia:** 15% (750 installs)

### Target Personas
1. **Budget-Conscious Young Professionals (23–34):** Live alone or with roommates, order takeout too frequently due to cooking friction, want quick 20-minute meals with leftover groceries.
2. **University Students & First-Time Homemakers (18–24):** Limited cooking skills, tight weekly budgets (\$50–\$75), highly active on TikTok and Reddit.
3. **Structured Meal-Preppers & Fitness Enthusiasts (25–40):** Value calorie control, high protein options, and structured weekly meal plans.

---

## 3. Acquisition Channels & Unit Economics ($7,800 Total Budget)

To guarantee **5,000 high-intent installs** within 30 days, we combine paid discovery (to jumpstart volume and algorithm rank) with high-converting organic viral loops and technical discoverability.

| Channel | Category | Target Installs | Budget | Target CPI | Conversion / Strategy Focus |
|---|---|---|---|---|---|
| **Google App Campaigns (UAC)** | Paid | 1,200 | \$3,000 | \$2.50 | High-intent Play Store queries (*"fridge recipe finder"*, *"pantry meal planner"*) |
| **Meta Ads (IG Reels / Stories)** | Paid | 750 | \$2,000 | \$2.67 | 9:16 Video hooks: *"What I cooked with 4 random items expiring in my fridge"* |
| **TikTok Spark Ads** | Paid | 650 | \$1,500 | \$2.30 | Problem-solution UGC ads targeting `#FoodWaste` & `#BudgetMeals` |
| **Micro-Creator Seeding** | Paid/Influencer | 700 | \$1,000 | \$1.43 | 10 creators (10k–50k followers) with \$100 honorarium / affiliate bounty |
| **ASO (App Store Optimization)** | Organic | 400 | \$0 | Free | Metadata optimization for Google Play store indexation |
| **Short-Form Video (TikTok/Reels/Shorts)** | Organic | 600 | \$0 | Free | 3 daily organic clips showcasing real phone fridge-scan demonstrations |
| **Reddit & Online Communities** | Organic | 250 | \$0 | Free | High-value, non-promotional case studies in r/EatCheapAndHealthy, r/MealPrepSunday |
| **SEO & AEO Programmatic Content** | Organic | 200 | \$300 (tools) | \$1.50 | Structured answer-engine recipe hubs answering conversational AI queries |
| **In-App Referral Loop** | Organic | 150 | \$0 | Free | Shareable weekly meal plan cards & grocery lists |
| **Total / Blended** | **Combined** | **5,000** | **\$7,800** | **\$1.56** | *(Includes \$500 contingency reserve)* |

---

## 4. Technical SEO, AEO & LLM Discoverability Strategy

Modern discovery extends beyond traditional Google search: millions of users now ask ChatGPT, Perplexity, and Claude: *"What can I cook with tomatoes, eggs, and feta?"*

### A. Programmatic Long-Tail Recipe Hubs
- Generate lightweight, fast-loading static landing pages based on high-frequency ingredient pairings (e.g., `/recipes/tomato-onion-spinach`).
- **Semantic HTML & Direct Inverted Pyramid:** Each page starts with an explicit, 40-word concise answer block answering the recipe query before listing steps. This optimizes directly for **AI Overviews (Google)**, **Perplexity Citations**, and **ChatGPT Search**.

### B. Structured Data (Schema.org JSON-LD)
Every recipe page includes strict, validated Schema markup:
```json
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Quick Shakshuka from Kitchen Leftovers",
  "cookTime": "PT20M",
  "prepTime": "PT10M",
  "totalTime": "PT30M",
  "recipeYield": "2 servings",
  "nutrition": {
    "@type": "NutritionInformation",
    "calories": "320 calories"
  }
}
```

### C. AI Crawler Directives (`robots.txt`)
Configure crawler permissions to encourage indexing by conversational answer engines:
```text
User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

Sitemap: https://cookwise.ai/sitemap.xml
```

---

## 5. 4-Week Execution Timeline

- **Week 1 (Launch & Soft Testing):**
  - Launch organic TikTok & Instagram accounts.
  - Setup Google App Campaigns with small test budget (\$50/day) to calibrate CPI in US vs. UK.
  - Publish initial Reddit case study on food waste reduction.
- **Week 2 (Creator Outreach & Scaling):**
  - Contract 10 micro-creators in food and college budgeting niches.
  - Scale winning Meta Reels and TikTok creative variants with ROAS > 2.0.
  - Launch ASO A/B test on Play Store screenshots.
- **Week 3 (Peak Push & Viral Loop):**
  - Coordinated posting across all 10 micro-influencers.
  - Enable in-app "Share your 7-day meal plan" image export.
  - Programmatic SEO pages indexed and monitored via Search Console.
- **Week 4 (Optimization & Retention):**
  - Retarget engaged users via push notifications to plan next week's meals.
  - Review funnel analytics: Image upload → Recipe generated → Recipe saved.
  - Consolidate CAC & LTV cohorts for Tier 1 geos.

---

## 6. Key Performance Indicators (KPIs)

- **Cost Per Install (CPI):** Under \$2.20 in US, under \$1.50 in UK/CA/AU (Target Blended: \$1.56).
- **Core Activation Rate:** % of installs that complete at least 1 fridge scan within 24 hours (Goal: > 55%).
- **Day 7 Retention:** Target > 24% (driven by weekly meal planning and grocery shopping cadence).
- **K-Factor (Virality):** > 0.15 (15 organic installs for every 100 paid installs through recipe/plan sharing).
