import { useState } from 'react';
import { db } from '../lib/supabase';

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/>
  </svg>
);

export default function AISuggestScreen({ onSuggest, onBack, user, onSignIn }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const generate = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    if (!user) { onSignIn(); return; }

    setError('');
    setLoading(true);

    try {
      const { data, error: fnError } = await db.functions.invoke('suggest-recipe', {
        body: { description: description.trim() },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      onSuggest(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main">
      <div className="suggest-card">
        <button className="suggest-back" onClick={onBack}>← Back to recipes</button>

        <div className="suggest-header">
          <span className="suggest-icon"><SparkleIcon /></span>
          <h2 className="suggest-title">Recipe Suggestion</h2>
          <p className="suggest-sub">
            Describe what you're craving and AI will generate a full recipe, ready to save.
          </p>
        </div>

        <form onSubmit={generate}>
          <div className="form-group">
            <label className="form-label">What do you feel like making?</label>
            <textarea
              className="form-ctrl suggest-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. spicy Thai noodles, a light summer salad, chocolate lava cake…"
              rows={3}
              required
              autoFocus
              disabled={loading}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn btn-primary suggest-btn" disabled={loading || !description.trim()}>
            {loading ? (
              <>
                <span className="suggest-spinner" />
                Generating your recipe…
              </>
            ) : (
              <><SparkleIcon /> Generate Recipe</>
            )}
          </button>
        </form>

        {loading && (
          <div className="suggest-loading-note">
            This usually takes 5–10 seconds.
          </div>
        )}
      </div>
    </main>
  );
}
