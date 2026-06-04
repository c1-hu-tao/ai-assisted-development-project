import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORIES = [
  'Appetizers','Baking','Breakfast','Desserts','Drinks','Main Course',
  'Meats','Pasta','Pastries','Salads','Seafood','Side Dishes',
  'Snacks','Soups','Vegetarian','Other',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { description } = await req.json();
    if (!description?.trim()) {
      return new Response(JSON.stringify({ error: 'Description is required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Generate a complete recipe based on this description: "${description.trim()}"

Return ONLY a valid JSON object with exactly these fields:
{
  "title": "Recipe name",
  "description": "One enticing sentence about the dish",
  "category": "One of: ${CATEGORIES.join(', ')}",
  "ingredients": ["quantity + ingredient", "..."],
  "instructions": "Step 1: ...\nStep 2: ...\n..."
}

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

    // Validate category falls within known list
    if (!CATEGORIES.includes(recipe.category)) recipe.category = 'Other';

    return new Response(JSON.stringify(recipe), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
