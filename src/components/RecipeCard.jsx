import { tagClass } from '../utils/helpers';

export default function RecipeCard({ recipe, onDelete, onEdit, matchCount, totalSelected, isOwner, onView }) {
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

      <div className="card-footer">
        <button className="btn btn-ghost btn-sm" onClick={() => onView(recipe)}>
          View Recipe
        </button>
        {isOwner && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(recipe)}>
              Edit
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => { if (window.confirm('Delete this recipe?')) onDelete(recipe.id); }}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}
