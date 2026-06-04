import { tagClass, formatCreator } from '../utils/helpers';

export default function RecipeModal({ recipe, onClose, creatorName }) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="form-card modal-recipe-card">
        {recipe.photo_url && (
          <div className="modal-photo-wrap">
            <img src={recipe.photo_url} alt={recipe.title} className="modal-photo" />
            {creatorName && <p className="modal-creator">{formatCreator(creatorName, recipe.is_ai_generated)}</p>}
          </div>
        )}
        <div className="modal-body">
          {!recipe.photo_url && creatorName && (
            <p className="modal-creator modal-creator--no-photo">{formatCreator(creatorName, recipe.is_ai_generated)}</p>
          )}
          <div className="modal-header">
            <div>
              <span className={`card-category ${tagClass(recipe.category)} modal-category`}>
                {recipe.subcategory ? `${recipe.category} › ${recipe.subcategory}` : recipe.category}
              </span>
              <h2 className="modal-title">{recipe.title}</h2>
            </div>
            <button className="btn btn-ghost btn-sm modal-close" onClick={onClose}>✕</button>
          </div>
          {recipe.description && <p className="card-desc modal-desc">{recipe.description}</p>}
          {ingredients.length > 0 && (
            <div className="detail-section">
              <div className="detail-label">Ingredients</div>
              <ul className="ing-list">
                {ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
              </ul>
            </div>
          )}
          {recipe.instructions && (
            <div className={`detail-section${ingredients.length > 0 ? ' detail-section--spaced' : ''}`}>
              <div className="detail-label">Instructions</div>
              <p className="instructions">{recipe.instructions}</p>
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
