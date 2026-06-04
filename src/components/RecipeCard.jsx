import { useState } from 'react';
import { tagClass, formatCreator } from '../utils/helpers';
import { HeartIcon } from './icons';

export default function RecipeCard({ recipe, onDelete, onEdit, matchCount, totalSelected, isOwner, onView, isFavourite, onToggleFavourite, creatorName }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <article className="recipe-card" onClick={() => onView(recipe)} style={{ cursor: 'pointer' }}>
        {recipe.photo_url && (
          <div className="card-photo-wrap">
            <img src={recipe.photo_url} alt={recipe.title} className="card-photo" />
          </div>
        )}

        <div className="card-top">
          <div className="card-meta-row">
            <span className={`card-category ${tagClass(recipe.category)}`}>
              {recipe.subcategory || recipe.category}
            </span>
            {totalSelected > 0 && matchCount > 0 && (
              <span className={`match-badge ${matchCount >= totalSelected ? 'match-full' : 'match-partial'}`}>
                {matchCount >= totalSelected ? '✓' : '~'} {matchCount}/{totalSelected}
              </span>
            )}
          </div>
          <h2 className="card-title">{recipe.title}</h2>
          {creatorName && (
            <p className="card-creator">{formatCreator(creatorName, recipe.is_ai_generated)}</p>
          )}
        </div>

        <div className="card-footer" onClick={e => e.stopPropagation()}>
          <button
            className={`fav-btn${isFavourite ? ' fav-btn--active' : ''}`}
            title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            onClick={() => onToggleFavourite(recipe.id)}
          >
            <HeartIcon filled={isFavourite} />
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
