import { useState } from 'react';
import { db } from '../lib/supabase';

export default function AuthModal({ onClose }) {
  const [mode, setMode]       = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onClose();
    } else {
      const { error } = await db.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setInfo('Check your email for a confirmation link, then sign in.');
    }

    setLoading(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="form-card auth-card">
        <h2 className="form-heading">{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-ctrl"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-ctrl"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
              minLength={mode === 'signup' ? 6 : undefined}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}
          {info  && <p className="auth-info">{info}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="auth-switch">
          {mode === 'signin'
            ? <>No account? <button className="auth-link" onClick={() => { setMode('signup'); setError(''); setInfo(''); }}>Sign up</button></>
            : <>Have an account? <button className="auth-link" onClick={() => { setMode('signin'); setError(''); setInfo(''); }}>Sign in</button></>
          }
        </p>
      </div>
    </div>
  );
}
