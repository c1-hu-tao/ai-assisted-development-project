# Recipe Collection

A web app for storing and browsing recipes. Backed by Supabase for real-time sync.

---

## Features

- **Add, edit, and delete recipes** — full form with title, description, category, ingredients, and instructions; delete requires confirmation
- **16 categories** with color-coded badges (Baking, Breakfast, Desserts, Drinks, Main Course, Meats, Pasta, Pastries, Salads, Seafood, Side Dishes, Snacks, Soups, Vegetarian, Appetizers, Other)
- **Category sidebar** with per-category counts and active highlighting
- **Random recipe picker** — click the dice icon next to any category to get a surprise recipe from it
- **Ingredient filter** — check off ingredients you have; cards show full (✓) or partial (~) match counts; smart normalization strips quantities, units, and descriptors so "2 cups all-purpose flour" matches a search for "flour"
- **Real-time sync** across all open browsers with a live green status badge
- **Expand / collapse** recipe details inline on each card

---

## Tech Stack

| Layer | Tool |
|---|---|
| UI | React 18 |
| Styling | Plain CSS (warm cream/coffee palette) |
| Bundler | Vite |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase `postgres_changes` subscriptions |

---

## Local Development

Requires [Node.js](https://nodejs.org/).

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## Database Setup

The app uses Supabase. On first load it will show a setup screen with the SQL to run. Paste it into your Supabase project's **SQL Editor** and click **Run**, then retry the connection.

If you see an "Unauthorized" error after setup, run this in the SQL Editor:

```sql
alter table public.recipes disable row level security;
```

---

## Deployment

Connect your GitHub repo to **Vercel** or **Netlify**. Both will auto-detect Vite and set the build command (`npm run build`) and output directory (`dist`) automatically.
