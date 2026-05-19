# Full-Stack Fitness & Tracking App

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?logo=fastapi&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_54-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql&logoColor=white)
![CI](https://github.com/Dheeraj-Banala/fitness-app/actions/workflows/test.yml/badge.svg)

A production-deployed iOS fitness tracking app built end-to-end — from database schema to mobile UI. Tracks food intake, workouts, water, and weight with real nutritional data from the USDA and Open Food Facts APIs.

> **Live on iOS** — viewable via [Expo Go](https://expo.dev/go) using the shareable link.

---

## Features

### Food Logging
- Search 900,000+ foods via USDA FoodData Central (Foundation + SR Legacy), with automatic fallback to Open Food Facts
- Barcode scanning for packaged foods
- Custom food creation with full macro and micronutrient profiles
- Recipe builder — creates a recipe from ingredients, calculates macros automatically
- Per-meal calorie and macro breakdown (Breakfast, Lunch, Dinner, Snack)
- Unit picker per food: grams, oz, or named serving sizes

### Workout Tracking
- Structured exercise database (51 global exercises + user-created custom exercises)
- Log sets with weight and reps per exercise
- Per-exercise history charts — max weight or max set volume over 30d / 90d / all time

### Health Metrics
- Daily water intake with progress tracking against a personal goal
- Weight log with a line chart showing trend over time
- Micronutrient breakdown (sodium, potassium, calcium, iron, vitamins, and more)
- Calorie and macro goals with progress bars

---

## Technical Highlights

### Backend
- **FastAPI** REST API with **SQLAlchemy 2.x** ORM and **PostgreSQL** (Neon managed)
- **JWT authentication** — 30-minute access tokens + 30-day sliding refresh tokens stored in DB (revocable)
- All nutrition stored **per 1g** in the database and scaled at display time — a single source of truth regardless of serving size
- External food search with a **graceful fallback chain**: USDA → Open Food Facts, so food search never silently fails
- Deployed to **Render** via Docker with environment secrets

### Mobile
- **React Native + Expo SDK 54** with TypeScript and the New Architecture enabled
- Automatic **401 token refresh** in `api.ts` — expired tokens are transparently refreshed and the original request retried without the user noticing
- `useFocusEffect` on all data-fetching screens so the UI always reflects the latest server state after navigation
- **EAS Update** for over-the-air JS bundle updates — no app store submission needed for feature pushes

### Data Model
11 tables: Users, Foods, Recipes, Recipe Ingredients, Food Logs, Workouts, Workout Sets, Water Logs, Weight Logs, User Goals, Refresh Tokens, Exercises

---

## Testing & CI

14 pytest tests covering the critical paths:

| Area | What's tested |
|---|---|
| Auth | Register, duplicate prevention, login, refresh token flow |
| Food log | 1g scaling math, quantity × nutrient correctness |
| Workouts | Atomic workout + sets write, cascade delete |
| Recipes | Macro calculation from ingredients, PATCH recalculates macros |
| Food API | USDA → Open Food Facts fallback, barcode lookup |
| PATCH endpoints | Food and recipe field updates |

GitHub Actions runs the full suite on every push to `master` using a Postgres service container.

---

## Stack

| Layer | Technology |
|---|---|
| Mobile | React Native, Expo SDK 54, TypeScript |
| Backend | FastAPI, SQLAlchemy 2.x, Uvicorn |
| Database | PostgreSQL (Neon managed) |
| Auth | JWT (python-jose), bcrypt |
| External APIs | USDA FoodData Central, Open Food Facts |
| Hosting | Render (backend), Neon (database), EAS (mobile updates) |
| Testing | pytest, httpx, GitHub Actions CI |

---

## Project Structure

```
fitness-app/
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy models (11 tables)
│   │   ├── routes/        # FastAPI route handlers
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # USDA + Open Food Facts API clients
│   │   ├── auth.py        # JWT creation, hashing, token validation
│   │   └── main.py        # App entry point + lifespan
│   ├── tests/             # pytest test suite
│   └── Dockerfile
└── mobile/
    └── app/
        ├── screens/       # 19 screens
        ├── navigation/    # Stack + tab navigators
        ├── context/       # AuthContext, PreferencesContext
        ├── services/      # api.ts (fetch + auto token refresh)
        └── theme.ts       # Design system (dark mode)
```

---

## Design Decisions

**Why store nutrition per 1g?**
External APIs return data per 100g. User logs food in arbitrary quantities (200g, 1.5 oz, 2 servings). Normalizing to per-1g at ingest time means one multiply at display time handles all cases cleanly, with no conversion logic scattered across the codebase.

**Why sliding refresh tokens stored in the DB?**
Storing refresh tokens server-side makes them revocable (logout actually works). The sliding expiry resets on every use, so active users stay logged in indefinitely while inactive sessions expire naturally after 30 days.

**Why USDA Foundation + SR Legacy only?**
The full USDA dataset includes branded foods with inconsistent nutrient data. Foundation and SR Legacy are research-grade entries with complete micronutrient profiles — better data quality for users who care about more than just macros.
