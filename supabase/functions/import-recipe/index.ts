// @ts-nocheck — Deno edge function; Deno globals and URL imports are valid at runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORIES: Record<string, string[]> = {
  'Meat & Poultry':    ['Chicken','Beef','Pork','Lamb','Turkey','Duck'],
  'Fish & Seafood':    ['Salmon','Tuna','Shrimp','White Fish','Shellfish'],
  'Vegetarian':        ['Pasta','Rice & Grains','Salads','Soups','Stir Fry'],
  'Vegan':             ['Legumes','Tofu & Tempeh','Raw','Smoothies'],
  'Breakfast':         ['Eggs','Pancakes & Waffles','Oats','Smoothie Bowls'],
  'Baking & Pastries': ['Bread','Cakes','Cookies','Pastries','Pies'],
  'Desserts':          ['Ice Cream','Puddings','Chocolate','Fruit Desserts'],
  'Drinks':            ['Coffee','Tea','Cocktails','Juices','Smoothies'],
  'Sides & Salads':    ['Salads','Roasted Veg','Dips & Sauces'],
  'Cuisine':           ['Italian','Asian','Mexican','Middle Eastern','Indian'],
};
const MAIN_CATS = Object.keys(CATEGORIES);

const SYSTEM_PROMPT = `You are a recipe import agent. The user will paste raw text copied from a food website.
Extract the recipe and return ONLY a valid JSON object — no markdown fences, no explanation.

Required shape:
{
  "title": "Recipe name, title-cased, no site suffix",
  "description": "One enticing sentence about the dish, max 120 chars",
  "category": "One of the main categories below",
  "subcategory": "Best matching subcategory",
  "ingredients": ["full ingredient string with metric units", "..."],
  "search_ingredients": ["normalized name for each ingredient, same order", "..."],
  "instructions": "Steps separated by blank lines, metric units throughout"
}

Categories and subcategories:
${MAIN_CATS.map(m => `  ${m}: ${CATEGORIES[m].join(', ')}`).join('\n')}

METRIC CONVERSION — apply to both ingredients and instructions:
- Temperature: °F → °C rounded to nearest 5° (325°F=165°C, 350°F=175°C, 375°F=190°C, 400°F=200°C, 425°F=220°C, 450°F=230°C)
- Cups of liquid → ml (1 cup=240ml)
- Cups of dry bulk (flour, sugar, oats, rice, butter, etc.) → grams (1 cup flour≈120g, 1 cup sugar≈200g, 1 cup butter≈225g, 1 cup oats≈90g, 1 cup rice≈185g)
- Tablespoons → ml for liquids (1 tbsp=15ml), grams for dry/powdered ingredients (1 tbsp salt≈18g, 1 tbsp sugar≈12g, 1 tbsp flour≈8g)
- Teaspoons → ml for liquids (1 tsp=5ml), grams for dry/powdered ingredients (1 tsp salt≈6g, 1 tsp sugar≈4g, 1 tsp baking powder≈4g)
- Weight: 1 oz=28g, 1 lb=450g
- Length: 1 inch=2.5cm
- NEVER add ml/grams to count-based ingredients (onions, eggs, cloves of garlic, chicken thighs, etc.) — keep the original count with no parenthetical annotation
- Round to clean numbers where sensible

INGREDIENT NORMALIZATION — for each entry in search_ingredients, apply these rules in order to its corresponding ingredient string:
1. Replace unicode fractions (½→1/2, ¼→1/4, ¾→3/4, ⅓→1/3, ⅔→2/3, ⅛→1/8)
2. Strip leading quantity (mixed numbers, fractions, decimals, integers, ranges)
3. Strip attached metric abbreviation left after number removal (e.g. "g", "ml", "kg")
4. Strip leading unit word: tablespoon/tbsp, teaspoon/tsp, cup, fl oz, pint, quart, gallon, liter/litre/ml, gram/g, kilogram/kg, oz, lb, piece, slice, can, package, bag, bunch, head, clove, stalk, sprig, pinch, dash, handful, strip, sheet, loaf
5. Strip leading size adjective: large, medium, small, big, extra-large
6. Strip leading state/prep adjective: dried, fresh, frozen, whole, raw, ground, powdered, crushed, canned, bottled, cooked, toasted, roasted
7. Remove parenthetical notes: (about 240ml), (optional), (finely chopped)
8. Remove everything from the first comma or semicolon onward: "garlic, minced" → "garlic"
9. Remove trailing prep words: diced, chopped, minced, sliced, grated, shredded, crumbled, peeled, crushed, mashed, beaten, sifted, melted, softened, toasted, roasted, divided, optional, roughly, finely, thinly, coarsely, lightly, heaping, heaped, packed
10. Remove leading filler: of, a, an, some
11. Lowercase and collapse whitespace
12. Singularize the last word: eggs→egg, tomatoes→tomato, leaves→leaf, berries→berry, peaches→peach — but leave uncountable words unchanged: flour, sugar, salt, water, milk, butter, oil, rice, honey, vinegar, pepper, broth, stock, cream, cheese, pasta, bread, meat, beef, pork, fish, spinach, lettuce, kale, garlic, ginger, basil, thyme, oregano, paprika, cinnamon, cumin, turmeric, cornstarch, yeast, vanilla, cocoa, parsley, cilantro, dill, rosemary, sage, mint, lemon, lime

Examples: "120g pancetta, roughly diced"→"pancetta", "2 cans 800g whole tomatoes"→"tomato", "1 clove garlic, sliced"→"garlic", "3 large eggs"→"egg", "60g pine nuts"→"pine nut", "10ml dried oregano"→"oregano"

For instructions: replace all imperial measurements inline. Number each step, separate with a blank line. Strip URLs and ads.
If a field cannot be determined leave it as an empty string.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (!req.headers.get('Authorization')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    let body: { text?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { text } = body;
    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text.trim() }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${err}`);
    }

    const ai = await res.json();
    const raw = ai.content?.[0]?.text ?? '';
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const recipe = JSON.parse(cleaned);

    // Validate category
    if (!MAIN_CATS.includes(recipe.category)) recipe.category = '';
    if (recipe.category && !CATEGORIES[recipe.category]?.includes(recipe.subcategory)) {
      recipe.subcategory = '';
    }

    // Ensure arrays are present and parallel
    const ingredients: string[] = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    const searchIngredients: string[] = Array.isArray(recipe.search_ingredients)
      ? recipe.search_ingredients
      : ingredients.map(() => '');
    recipe.ingredients = ingredients;
    recipe.search_ingredients = searchIngredients.slice(0, ingredients.length);
    recipe.photo_url = null;
    recipe.is_ai_generated = false;

    return new Response(JSON.stringify(recipe), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
