# Recipe Collection

A web app for storing, browsing, and planning meals around your personal recipe collection. Backed by Supabase for real-time sync.

---

## Features

### Recipes
- **Add, edit, and delete recipes** — full form with title, description, category, ingredients, and instructions; delete requires confirmation
- **AI recipe import** — describe a dish in plain text and have a recipe generated and pre-filled into the form via a Supabase Edge Function
- **Ingredient normalization** — quantities, units, and prep notes are stripped and ingredients are stored in canonical plural form so searches stay consistent
- **16 categories** with color-coded badges (Baking, Breakfast, Desserts, Drinks, Main Course, Meats, Pasta, Pastries, Salads, Seafood, Side Dishes, Snacks, Soups, Vegetarian, Appetizers, Other)
- **Category sidebar** with per-category counts and active highlighting
- **Random recipe picker** — click the dice icon next to any category to get a surprise recipe from it
- **Ingredient filter** — check off ingredients you have; cards show full (✓) or partial (~) match counts
- **Expand / collapse** recipe details inline on each card
- **Real-time sync** across all open browsers with a live green status badge

### Meal Planner
- **Weekly meal plan grid** — assign recipes to Breakfast, Lunch, Dinner, or Snack slots for each day of the week
- **Week navigation** — browse forward and backward by week; plan persists per week
- **AI meal plan suggestions** — generate a full week's plan based on your existing recipe collection
- **Slot picker** — search and select any saved recipe directly from the planner grid

### Account
- **Sign up / sign in** — email and password authentication via Supabase Auth
- **Profile management** — update display name and account details

---

## Tech Stack

| Layer | Tool |
|---|---|
| UI | React 18 |
| Styling | Plain CSS (warm cream/coffee palette) |
| Bundler | Vite |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Real-time | Supabase `postgres_changes` subscriptions |
| AI features | Supabase Edge Functions |

---

## Local Development

Requires [Node.js](https://nodejs.org/).

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---
