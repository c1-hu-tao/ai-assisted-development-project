import { useState, useRef } from 'react';
import { normalizeIng } from '../utils/helpers';

export default function RecipeForm({ initialData, onSave, onClose }) {
  const isEdit = !!initialData;
  const [title, setTitle]               = useState(initialData?.title || '');
  const [desc, setDesc]                 = useState(initialData?.description || '');
  const [category, setCategory]         = useState(initialData?.category || 'Baking');
  const [ingredients, setIngredients]   = useState(initialData?.ingredients || []);
  const [searchTags, setSearchTags]     = useState(() => {
    if (!initialData) return [];
    const tags = initialData.search_ingredients || [];
    return tags.length > 0 ? tags : (initialData.ingredients || []).map(normalizeIng);
  });
  const [ingInput, setIngInput]         = useState('');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const ingRef = useRef(null);

  const commitIng = () => {
    const v = ingInput.trim();
    if (!v) return;
    setIngredients(prev => [...prev, v]);
    setSearchTags(prev => [...prev, normalizeIng(v)]);
    setIngInput('');
    ingRef.current?.focus();
  };

  const removeIng = (i) => {
    setIngredients(prev => prev.filter((_, j) => j !== i));
    setSearchTags(prev => prev.filter((_, j) => j !== i));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...(isEdit ? { id: initialData.id } : {}),
      title: title.trim(), description: desc.trim(), category, ingredients,
      search_ingredients: searchTags.map(t => t.trim()).filter(Boolean),
      instructions: instructions.trim(),
    });
    onClose();
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="form-card">
        <h2 className="form-heading">{isEdit ? 'Edit Recipe' : 'Add New Recipe'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-ctrl" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Lavender Shortbread Cookies" required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Short Description</label>
            <input className="form-ctrl" value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="A single enticing sentence about this dish" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-ctrl" value={category} onChange={e => setCategory(e.target.value)}>
              <option>Appetizers</option><option>Baking</option><option>Breakfast</option>
              <option>Desserts</option><option>Drinks</option><option>Main Course</option>
              <option>Meats</option><option>Pasta</option><option>Pastries</option>
              <option>Salads</option><option>Seafood</option><option>Side Dishes</option>
              <option>Snacks</option><option>Soups</option><option>Vegetarian</option><option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Ingredients</label>
              <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontStyle: 'italic' }}>full text · filter name →</span>
            </div>
            <div className="ing-builder">
              {ingredients.map((ing, i) => (
                <div key={i} className="ing-chip">
                  <span className="ing-chip-label" title={ing}>{ing}</span>
                  <input
                    className="ing-search-tag"
                    value={searchTags[i] || ''}
                    onChange={e => setSearchTags(prev => prev.map((t, j) => j === i ? e.target.value : t))}
                    placeholder="e.g. egg"
                    title="Searchable name used in the ingredient filter"
                  />
                  <button type="button" className="ing-remove" onClick={() => removeIng(i)}>×</button>
                </div>
              ))}
              <div className="ing-add-row">
                <input className="form-ctrl" ref={ingRef} value={ingInput}
                  onChange={e => setIngInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitIng(); } }}
                  placeholder="e.g. 2 cups flour — Enter to add" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={commitIng}
                  style={{ whiteSpace: 'nowrap' }}>+ Add</button>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Instructions</label>
            <textarea className="form-ctrl" value={instructions} onChange={e => setInstructions(e.target.value)}
              placeholder="Walk through the steps. Blank lines create natural paragraph breaks." rows={6} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Save Changes' : 'Save Recipe'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
