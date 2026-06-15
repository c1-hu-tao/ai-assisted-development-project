// @ts-nocheck — Deno edge function; Deno globals and URL imports are valid at runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a meal planning assistant. You will receive a JSON object with:
- "recipes": array of available recipes (each has id, title, category, subcategory, search_ingredients)
- "existingDinners": object mapping day index (string) to recipe_id already assigned
- "targetDays": array of day indices to plan (0=Monday, 1=Tuesday, ..., 6=Sunday)

Your task: assign one recipe to each day in targetDays that does NOT already appear in existingDinners. Do not repeat recipes already used.

Apply variety: avoid same subcategory on back-to-back days, spread protein types across the week. If the recipe pool is small and you must repeat a recipe to fill all slots, that is acceptable — always fill every empty slot.

You MUST respond with ONLY a JSON array. No explanation, no markdown, no code fences. Example:
[{"day":0,"recipe_id":"abc-123"},{"day":1,"recipe_id":"def-456"}]

Use the exact recipe ids from the input. Only include days that are empty (not in existingDinners). If no empty days exist, return [].`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (!req.headers.get('Authorization')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    let body;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const recipes = Array.isArray(body?.recipes) ? body.recipes : [];
    const existingDinners = body?.existingDinners ?? {};
    const targetDays = Array.isArray(body?.targetDays) ? body.targetDays : [0, 1, 2, 3, 4];

    if (recipes.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const userMessage = `Here is the data:\n${JSON.stringify({ recipes, existingDinners, targetDays }, null, 2)}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const ai = await res.json();
    const raw = (ai.content?.[0]?.text ?? '').trim();

    // Extract JSON array from anywhere in the response
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start === -1 || end === -1) {
      throw new Error(`Model returned no JSON array. Raw: ${raw.slice(0, 200)}`);
    }

    const plan = JSON.parse(raw.slice(start, end + 1));
    if (!Array.isArray(plan)) throw new Error('Parsed response is not an array');

    // Coerce and filter: day must be a valid target day not already assigned
    const validIds = new Set(recipes.map((r) => String(r.id)));
    const existingDays = new Set(Object.keys(existingDinners).map(Number));
    const targetDaysNum = targetDays.map(Number);

    const result = plan
      .map((e) => ({
        day: Number(e?.day),
        recipe_id: String(e?.recipe_id ?? ''),
      }))
      .filter((e) =>
        !isNaN(e.day) &&
        targetDaysNum.includes(e.day) &&
        !existingDays.has(e.day) &&
        validIds.has(e.recipe_id)
      );

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
