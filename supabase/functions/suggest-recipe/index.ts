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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (!req.headers.get('Authorization')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    let body: { description?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
    const { description } = body;
    if (!description?.trim()) {
      return new Response(JSON.stringify({ error: 'Description is required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const categoryGuide = MAIN_CATS.map(m => `  ${m}: ${CATEGORIES[m].join(', ')}`).join('\n');
    const prompt = `Generate a complete recipe based on this description: "${description.trim()}"

Return ONLY a valid JSON object with exactly these fields:
{
  "title": "Recipe name",
  "description": "One enticing sentence about the dish",
  "category": "One of the main categories listed below",
  "subcategory": "The most fitting subcategory from that main category",
  "ingredients": ["quantity + ingredient", "..."],
  "instructions": "Step 1: ...\nStep 2: ...\n..."
}

Available categories and their subcategories:
${categoryGuide}

No markdown fences, no explanation — only the raw JSON object.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${err}`);
    }

    const ai = await res.json();
    const raw = ai.content?.[0]?.text ?? '';

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const recipe = JSON.parse(cleaned);

    // Validate category and subcategory
    if (!MAIN_CATS.includes(recipe.category)) recipe.category = MAIN_CATS[0];
    const validSubs = CATEGORIES[recipe.category];
    if (!validSubs.includes(recipe.subcategory)) recipe.subcategory = validSubs[0];

    return new Response(JSON.stringify(recipe), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
