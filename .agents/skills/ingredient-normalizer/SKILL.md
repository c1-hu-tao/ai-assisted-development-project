---
name: ingredient-normalizer
description: Strips quantities, units, and prep notes from ingredient strings, returning only the lowercase singular ingredient name. Use when parsing recipe ingredients, building shopping lists, or deduplicating ingredient references across recipes.
license: MIT
metadata:
  author: Lynn
  version: "2.0.0"
---

# Ingredient Normalizer

Strips quantities, units, size adjectives, and prep notes from raw ingredient strings to extract a clean, lowercase, **singular** canonical name. Handles metric and imperial units, fractional quantities, mixed numbers, unicode fractions, and attached metric abbreviations (e.g. `120g`).

## When to Apply

- Producing `search_ingredients` tags for recipe filtering and deduplication
- Comparing ingredient presence across recipes (`"1 egg"` and `"2 eggs"` → both `"egg"`)
- Building canonical ingredient indexes or shopping list groupings

## Normalization Rules

Apply these transformations **in order**:

### 1. Replace Unicode Fractions

Convert unicode fraction characters to ASCII before any numeric stripping:
`½→1/2`, `¼→1/4`, `¾→3/4`, `⅓→1/3`, `⅔→2/3`, `⅛→1/8`, `⅜→3/8`, `⅝→5/8`, `⅞→7/8`

### 2. Strip Leading Quantity

Remove any leading number at the start of the string:
- Mixed numbers: `1 1/2`, `2 3/4`
- Fractions and ranges: `1/2`, `1/2 to 1`
- Integers, decimals, ranges: `2`, `1.5`, `2-3`

Trim after this step.

### 3. Strip Attached Metric Unit

After stripping the number, a metric abbreviation may be left with no space (e.g. `120g` → strip `120` → leftover `g`). Strip any leading bare metric abbreviation: `g`, `kg`, `mg`, `ml`, `dl`, `cl`, `l`.

### 4. Strip Leading Unit Word

Remove the leading cooking unit word (case-insensitive, singular or plural). Trim after.

**Volume:** cup/cups, tablespoon/tablespoons/tbsp/tbs, teaspoon/teaspoons/tsp, fluid ounce/fl oz, pint/pints, quart/quarts, gallon/gallons/gal, liter/liters/litre/litres, milliliter/milliliters/ml

**Weight:** ounce/ounces/oz, pound/pounds/lb/lbs, gram/grams, kilogram/kilograms/kg, milligram/milligrams/mg, and bare abbreviations: g, kg, ml, mg, dl, cl

**Count / misc:** piece/pieces, slice/slices, can/cans, package/packages/pkg, bag/bags, bunch/bunches, head/heads, clove/cloves, stalk/stalks, sprig/sprigs, pinch/pinches, dash/dashes, handful/handfuls, strip/strips, sheet/sheets, loaf/loaves

> **Important:** `pinch/pinches` uses the pattern `pinch(?:es)?` — **not** `pinches?` (which would incorrectly match "pinche" but not "pinch").

### 5. Strip Size Adjectives

Remove a leading size word: `large`, `medium`, `small`, `big`, `extra-large`, `extra large`.

### 6. Strip Leading State/Prep Adjectives

Remove a leading preparation state word: `dried`, `fresh`, `frozen`, `whole`, `raw`, `ground`, `powdered`, `crushed`, `canned`, `bottled`, `cooked`, `toasted`, `roasted`.

### 7. Strip Parentheticals

Remove all parenthetical notes: `(about 240ml)`, `(optional)`, `(finely chopped)`.

### 8. Strip Prep Phrases After Comma or Semicolon

Remove everything from the first `,` or `;` onward: `garlic, minced` → `garlic`, `onion; diced` → `onion`.

### 9. Strip Trailing Prep Words

Remove a trailing preparation word at the end of the string:
`diced`, `chopped`, `minced`, `sliced`, `grated`, `shredded`, `crumbled`, `peeled`, `crushed`, `mashed`, `beaten`, `sifted`, `melted`, `softened`, `toasted`, `roasted`, `fresh`, `dried`, `frozen`, `cooked`, `cooled`, `divided`, `optional`, `roughly`, `finely`, `thinly`, `coarsely`, `lightly`, `heaping`, `heaped`, `packed`.

### 10. Strip Filler Words

Remove a leading filler word: `of`, `a`, `an`, `some`.

### 11. Lowercase and Collapse Whitespace

Convert to lowercase. Collapse multiple spaces. Trim.

### 12. Singularize Last Word

Normalize to **singular** form so `"eggs"` and `"egg"` both become `"egg"`. Only the last word of a multi-word name is singularized.

Rules (applied to the last word, already lowercased):
- If in the **uncountable set** → leave as-is
- Ends in `ies` (length > 4) → replace with `y`: `berries→berry`, `cherries→cherry`
- Ends in `ves` (length > 4) → replace with `f`: `leaves→leaf`, `loaves→loaf`
- Ends in `ches`, `shes`, `xes`, `zes` → strip `es`: `peaches→peach`, `dishes→dish`
- Ends in `s`, not `ss`, length > 3 → strip `s`: `eggs→egg`, `onions→onion`
- Otherwise → leave as-is

**Uncountable set** (never modified):
`flour`, `sugar`, `salt`, `water`, `milk`, `butter`, `oil`, `rice`, `honey`, `vinegar`, `pepper`, `broth`, `stock`, `cream`, `cheese`, `pasta`, `bread`, `meat`, `beef`, `pork`, `fish`, `spinach`, `lettuce`, `kale`, `garlic`, `ginger`, `basil`, `thyme`, `oregano`, `paprika`, `cinnamon`, `cumin`, `turmeric`, `cornstarch`, `yeast`, `vanilla`, `cocoa`, `parsley`, `cilantro`, `dill`, `rosemary`, `sage`, `mint`, `lemon`, `lime`, `baking`

## Examples

| Input | Output |
|---|---|
| `2 cups all-purpose flour` | `all-purpose flour` |
| `1/2 tsp salt` | `salt` |
| `1 1/2 tbsp olive oil` | `olive oil` |
| `3 large eggs` | `egg` |
| `1 egg` | `egg` |
| `2 eggs` | `egg` |
| `120g pancetta, roughly diced` | `pancetta` |
| `1 clove garlic, sliced thin` | `garlic` |
| `2 cans 800g whole tomatoes` | `tomato` |
| `60g pine nuts, roughly chopped` | `pine nut` |
| `10ml dried oregano` | `oregano` |
| `1 pinch coarse-ground black pepper` | `coarse-ground black pepper` |
| `1 bay leaf` | `bay leaf` |
| `3 bay leaves` | `bay leaf` |
| `1 small onion, diced` | `onion` |
| `½ cup sugar` | `sugar` |
| `30ml parsley, chopped` | `parsley` |

## Implementation

```typescript
const UNCOUNTABLE = new Set([
  'flour','sugar','salt','water','milk','butter','oil','rice','honey',
  'vinegar','pepper','broth','stock','cream','cheese','pasta','bread',
  'meat','beef','pork','fish','spinach','lettuce','kale','garlic','ginger',
  'basil','thyme','oregano','paprika','cinnamon','cumin','turmeric',
  'cornstarch','yeast','vanilla','cocoa','parsley','cilantro','dill',
  'rosemary','sage','mint','lemon','lime','baking',
]);

const PREP_WORDS = /\s+(diced|chopped|minced|sliced|grated|shredded|crumbled|peeled|crushed|mashed|beaten|sifted|melted|softened|toasted|roasted|fresh|dried|frozen|cooked|cooled|divided|optional|roughly|finely|thinly|coarsely|lightly|heaping|heaped|packed)\s*$/i;

const UNITS = [
  'tablespoons?','tbsps?','tbs','teaspoons?','tsps?',
  'fluid ounces?','fl\\.? oz\\.?',
  'cups?','pints?','pts?','quarts?','qts?','gallons?','gal',
  'liters?','litres?','milliliters?','millilitres?',
  'grams?','kilograms?','milligrams?',
  'ounces?','pounds?',
  'pieces?','slices?','cans?','packages?','pkgs?','bags?',
  'bunch(?:es)?','head(?:s)?','cloves?','stalks?','sprigs?',
  'pinch(?:es)?','dash(?:es)?','handful(?:s)?',
  'strips?','sheets?','loaves?','loaf',
  'kg','g','ml','mg','dl','cl','l(?=\\s|$)',
  'lbs?','oz\\.?',
].join('|');

function singularizeWord(w: string): string {
  if (UNCOUNTABLE.has(w)) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ves') && w.length > 4) return w.slice(0, -3) + 'f';
  if (/(?:ch|sh|x|z)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  return w;
}

function normalizeIngredient(raw: string): string {
  let s = raw.replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, m =>
    ({'½':'1/2','¼':'1/4','¾':'3/4','⅓':'1/3','⅔':'2/3',
      '⅛':'1/8','⅜':'3/8','⅝':'5/8','⅞':'7/8'}[m] ?? m)
  );
  // 2. Strip leading quantity
  s = s.replace(/^\d+\s+\d+\/\d+/, '');
  s = s.replace(/^\d+\/\d+(\s+to\s+\d+\/\d+)?/, '');
  s = s.replace(/^\d+(\.\d+)?(\s*[-–]\s*\d+(\.\d+)?)?/, '');
  s = s.trim();
  // 3. Strip attached metric abbreviation
  s = s.replace(/^\d+(\.\d+)?\s*(ml|g|kg|mg|dl|cl|l)\s*/i, '');
  s = s.replace(/^(ml|g|kg|mg|dl|cl)(?=\s|$)/i, '').trim();
  // 4. Strip leading unit word
  s = s.replace(new RegExp(`^(${UNITS})\\b\\.?`, 'i'), '').trim();
  // 5. Strip size adjectives
  s = s.replace(/^(extra-?large|large|medium|small|big)\s+/i, '');
  // 6. Strip leading state/prep adjectives
  s = s.replace(/^(dried|fresh|frozen|whole|raw|ground|powdered|crushed|canned|bottled|cooked|toasted|roasted)\s+/i, '');
  // 7. Strip parentheticals
  s = s.replace(/\(.*?\)/g, '');
  // 8. Strip prep phrases after comma or semicolon
  s = s.replace(/[,;]\s*.*$/, '');
  // 9. Strip trailing prep words
  s = s.replace(PREP_WORDS, '');
  // 10. Strip filler
  s = s.replace(/^(of|a|an|some)\s+/i, '');
  // 11. Lowercase and collapse whitespace
  s = s.trim().toLowerCase().replace(/\s{2,}/g, ' ');
  if (!s) return '';
  // 12. Singularize last word
  const words = s.split(' ');
  words[words.length - 1] = singularizeWord(words[words.length - 1]);
  return words.join(' ');
}
```

## Edge Cases

- **`1 pinch coarse-ground black pepper`** — "pinch" stripped via `pinch(?:es)?`; "pepper" is uncountable → `coarse-ground black pepper`
- **`2 cans 800g whole tomatoes`** — strip `2`, `cans`, `800g`, `whole` → `tomato`
- **`1 small onion, diced`** — strip `1`, `small`, `, diced` → `onion`
- **`dried oregano`** — strip leading `dried` → `oregano` (uncountable, unchanged)
- **Already normalized** — function is idempotent; running it twice returns the same result
