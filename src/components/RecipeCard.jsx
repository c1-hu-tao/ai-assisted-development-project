import { useState } from 'react';
import { tagClass } from '../utils/helpers';

export default function RecipeCard({ recipe, onDelete, onEdit, matchCount, totalSelected }) {
  const [open, setOpen] = useState(false);
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

  return (
    <article className="recipe-card">
      <div className="card-top">
        <div className="card-meta-row">
          <span className={`card-category ${tagClass(recipe.category)}`}>{recipe.category}</span>
          {totalSelected > 0 && matchCount > 0 && (
            <span className={`match-badge ${matchCount >= totalSelected ? 'match-full' : 'match-partial'}`}>
              {matchCount >= totalSelected ? '✓' : '~'} {matchCount}/{totalSelected}
            </span>
          )}
        </div>
        <h2 className="card-title">{recipe.title}</h2>
        {recipe.description && <p className="card-desc">{recipe.description}</p>}
      </div>

      {open && (
        <div className="card-details">
          {ingredients.length > 0 && (
            <div className="detail-section">
              <div className="detail-label">Ingredients</div>
              <ul className="ing-list">
                {ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
              </ul>
            </div>
          )}
          {recipe.instructions && (
            <div className="detail-section">
              <div className="detail-label">Instructions</div>
              <p className="instructions">{recipe.instructions}</p>
            </div>
          )}
        </div>
      )}

      <div className="card-footer">
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(o => !o)}>
          {open ? 'Collapse' : 'View Recipe'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(recipe)}>
          Edit
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => { if (window.confirm('Delete this recipe?')) onDelete(recipe.id); }}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
