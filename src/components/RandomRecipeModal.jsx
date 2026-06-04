import { tagClass } from '../utils/helpers';

export default function RandomRecipeModal({ recipe, onClose }) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="form-card" style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', paddingBottom: '0.85rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--border)' }}>
          <div>
            <span className={`card-category ${tagClass(recipe.category)}`} style={{ display: 'inline-block', marginBottom: '0.5rem' }}>{recipe.category}</span>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--espresso)', fontWeight: 'normal' }}>{recipe.title}</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ flexShrink: 0 }}>✕</button>
        </div>
        {recipe.description && (
          <p className="card-desc" style={{ marginBottom: '1rem' }}>{recipe.description}</p>
        )}
        {ingredients.length > 0 && (
          <div className="detail-section">
            <div className="detail-label">Ingredients</div>
            <ul className="ing-list">
              {ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
            </ul>
          </div>
        )}
        {recipe.instructions && (
          <div className="detail-section" style={{ marginTop: ingredients.length > 0 ? '1rem' : 0 }}>
            <div className="detail-label">Instructions</div>
            <p className="instructions">{recipe.instructions}</p>
          </div>
        )}
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
