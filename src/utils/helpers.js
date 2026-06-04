export const CATEGORY_CLASS = {
  'Pastries':    'tag-pastries',
  'Drinks':      'tag-drinks',
  'Baking':      'tag-baking',
  'Breakfast':   'tag-breakfast',
  'Desserts':    'tag-desserts',
  'Main Course': 'tag-main',
  'Meats':       'tag-meats',
  'Salads':      'tag-salads',
  'Vegetarian':  'tag-veg',
  'Soups':       'tag-soups',
  'Pasta':       'tag-pasta',
  'Seafood':     'tag-seafood',
  'Snacks':      'tag-snacks',
  'Side Dishes': 'tag-sides',
  'Sides':       'tag-sides',
  'Appetizers':  'tag-appetizers',
};

export const tagClass = (cat) => CATEGORY_CLASS[cat] || 'tag-other';

export function isTableMissing(err) {
  return (
    err.code === '42P01' || err.code === 'PGRST200' ||
    (err.message && (err.message.includes('does not exist') || err.message.includes('schema cache')))
  );
}

/* Strip quantities/units from ingredient strings to get a usable search name.
   e.g. "1 large egg" → "egg", "100g almond flour" → "almond flour" */
export function normalizeIng(raw) {
  let s = raw.toLowerCase().trim();
  for (let pass = 0; pass < 3; pass++) {
    s = s
      .replace(/^[\d\s½¼¾⅓⅔⅛⅜⅝⅞.,/×x+\-]+/, '')
      .replace(/^(a|an)\s+/, '')
      .replace(/^(cups?|tbsps?|tsps?|tablespoons?|teaspoons?|grams?|kg|oz|ounces?|ml|liters?|lbs?|pounds?|cloves?|pinch|handful|bunch|large|medium|small|cans?|packages?|packets?|slices?|pieces?|strips?|sprigs?|dashes?|drops?)\s+(of\s+)?/i, '')
      .trim();
  }
  return s
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/,\s*(optional|to taste|room temperature|softened|diced|chopped|minced|sliced|grated|shredded|crumbled|peeled|fresh|dried|frozen|cooked|uncooked|cooled|melted|beaten|sifted|divided|roughly|finely).*$/i, '')
    .replace(/,.*$/, '')
    .trim();
}
