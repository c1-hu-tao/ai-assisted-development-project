import { useState } from 'react';
import { db } from '../lib/supabase';
import { tagClass } from '../utils/helpers';

const SparkleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/>
  </svg>
);

export default function MealSlotPicker({ day, mealType, currentRecipe, recipes, user, onAssign, onRemove, onSaveAndAssign, onClose }) {
  const [view,        setView]        = useState('pick'); // 'pick' | 'generate'
  const [search,      setSearch]      = useState('');
  const [description, setDescription] = useState('');
  const [generating,  setGenerating]  = useState(false);
  const [genResult,   setGenResult]   = useState(null); // generated recipe data
  const [genError,    setGenError]    = useState('');
  const [saving,      setSaving]      = useState(false);

  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setGenerating(true);
    setGenError('');
    setGenResult(null);
    try {
      const { data, error } = await db.functions.invoke('suggest-recipe', {
        body: { description: description.trim() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setGenResult(data);
    } catch (err) {
      setGenError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAndAssign = async () => {
    if (!genResult) return;
    setSaving(true);
    await onSaveAndAssign({ ...genResult, is_ai_generated: true });
    setSaving(false);
  };

  return (
    <div className="overlay">
      <div className="form-card picker-card">
        {/* Header */}
        <div className="picker-header">
          <div>
            <p className="picker-eyebrow">{mealType}</p>
            <h2 className="form-heading" style={{ marginBottom: 0 }}>{day}</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Current assignment */}
        {currentRecipe && (
          <div className="picker-current">
            <span className={`card-category ${tagClass(currentRecipe.category)}`} style={{ fontSize: '0.65rem' }}>
              {currentRecipe.category}
            </span>
            <span className="picker-current-name">{currentRecipe.title}</span>
            <button className="btn btn-danger btn-sm" onClick={onRemove}>Remove</button>
          </div>
        )}

        {/* View toggle */}
        <div className="picker-tabs">
          <button className={`picker-tab${view === 'pick' ? ' active' : ''}`} onClick={() => { setView('pick'); setGenResult(null); setGenError(''); }}>
            Pick Recipe
          </button>
          <button className={`picker-tab${view === 'generate' ? ' active' : ''}`} onClick={() => setView('generate')}>
            <SparkleIcon /> Suggest Recipe
          </button>
        </div>

        {/* Pick view */}
        {view === 'pick' && (
          <>
            <input
              className="form-ctrl"
              placeholder="Search recipes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{ marginBottom: '0.75rem' }}
            />
            <div className="picker-list">
              {filtered.length === 0
                ? <p className="picker-empty">No recipes found.</p>
                : filtered.map(r => (
                  <button key={r.id} className="picker-recipe-row" onClick={() => onAssign(r)}>
                    <span className={`card-category ${tagClass(r.category)}`} style={{ fontSize: '0.62rem', flexShrink: 0 }}>
                      {r.category}
                    </span>
                    <span className="picker-recipe-title">{r.title}</span>
                  </button>
                ))
              }
            </div>
          </>
        )}

        {/* Generate view */}
        {view === 'generate' && (
          <div className="picker-generate">
            {!genResult ? (
              <form onSubmit={handleGenerate}>
                <div className="form-group">
                  <label className="form-label">What are you craving?</label>
                  <textarea
                    className="form-ctrl"
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={`e.g. a light ${mealType.toLowerCase()} with eggs…`}
                    required
                    autoFocus
                    disabled={generating}
                    style={{ resize: 'none' }}
                  />
                </div>
                {genError && <p className="auth-error">{genError}</p>}
                <button type="submit" className="btn btn-primary suggest-btn" disabled={generating || !description.trim()}>
                  {generating ? <><span className="suggest-spinner" /> Generating…</> : <><SparkleIcon /> Generate</>}
                </button>
                {generating && <p className="suggest-loading-note">This usually takes 5–10 seconds.</p>}
              </form>
            ) : (
              <div className="picker-gen-result">
                <span className={`card-category ${tagClass(genResult.category)}`}>{genResult.category}</span>
                <h3 className="picker-gen-title">{genResult.title}</h3>
                <p className="card-desc" style={{ marginBottom: '1rem' }}>{genResult.description}</p>
                <div className="form-actions" style={{ marginTop: 0, paddingTop: 0, border: 'none' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setGenResult(null)}>Try again</button>
                  <button className="btn btn-primary" onClick={handleSaveAndAssign} disabled={saving}>
                    {saving ? 'Saving…' : 'Save & Add to Plan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
