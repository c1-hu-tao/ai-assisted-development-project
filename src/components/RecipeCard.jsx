import { useState } from 'react';
import { tagClass } from '../utils/helpers';

const HeartIcon = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function RecipeCard({ recipe, onDelete, onEdit, matchCount, totalSelected, isOwner, onView, isFavourite, onToggleFavourite }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <article className="recipe-card">
        {recipe.photo_url && (
          <div className="card-photo-wrap">
            <img src={recipe.photo_url} alt={recipe.title} className="card-photo" />
          </div>
        )}

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
        </div>

        <div className="card-footer">
          <button
            className={`fav-btn${isFavourite ? ' fav-btn--active' : ''}`}
            title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            onClick={() => onToggleFavourite(recipe.id)}
          >
            <HeartIcon filled={isFavourite} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onView(recipe)}>
            View Recipe
          </button>
          {isOwner && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit(recipe)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
            </>
          )}
        </div>
      </article>

      {confirmDelete && (
        <div className="overlay" onClick={() => setConfirmDelete(false)}>
          <div className="form-card confirm-card" onClick={e => e.stopPropagation()}>
            <h2 className="form-heading">Delete Recipe</h2>
            <p className="confirm-msg">
              Are you sure you want to delete <strong>{recipe.title}</strong>? This cannot be undone.
            </p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => { setConfirmDelete(false); onDelete(recipe.id); }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
