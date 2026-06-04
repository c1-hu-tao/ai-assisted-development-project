import { useState } from 'react';

export default function IngredientFilter({ allIngredients, selected, onToggle, onClearAll }) {
  const [search, setSearch] = useState('');
  const filtered = allIngredients.filter(ing => ing.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="ingredient-filter">
      <div className="filter-heading">My Ingredients</div>
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="filter-search"
      />
      <div className="ingredient-list">
        {filtered.map(ing => (
          <label key={ing} className="ingredient-check">
            <input
              type="checkbox"
              checked={selected.includes(ing)}
              onChange={() => onToggle(ing)}
            />
            <span>{ing}</span>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
          <button className="btn btn-sm btn-ghost" style={{ width: '100%' }} onClick={onClearAll}>
            Clear ({selected.length})
          </button>
        </div>
      )}
    </div>
  );
}
