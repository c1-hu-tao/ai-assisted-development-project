import { useState } from 'react';
import { db } from '../lib/supabase';

export default function ProfileModal({ user, currentName, onClose, onSaved }) {
  const [name, setName]       = useState(currentName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    const { error } = await db.from('profiles')
      .upsert({ id: user.id, name: name.trim() }, { onConflict: 'id' });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onSaved(name.trim());
      onClose(); // unmounts component — no state updates after this
    }
  };

  return (
    <div className="overlay">
      <div className="form-card auth-card">
        <h2 className="form-heading">Edit Display Name</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-ctrl"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              placeholder="Your display name"
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
