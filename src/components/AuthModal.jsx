import { useState } from 'react';
import { db } from '../lib/supabase';

export default function AuthModal({ onClose }) {
  const [mode, setMode]         = useState('signin');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [info, setInfo]         = useState('');
  const [loading, setLoading]   = useState(false);

  const switchMode = (m) => { setMode(m); setError(''); setInfo(''); };

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
      const { error } = await db.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() } },
      });
      if (error) setError(error.message);
      else setInfo('Check your email for a confirmation link, then sign in.');
    }

    setLoading(false);
  };

  return (
    <div className="overlay">
      <div className="form-card auth-card">
        <h2 className="form-heading">{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
        <form onSubmit={submit}>
          {mode === 'signup' && (
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
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-ctrl"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus={mode === 'signin'}
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
            ? <>No account? <button className="auth-link" onClick={() => switchMode('signup')}>Sign up</button></>
            : <>Have an account? <button className="auth-link" onClick={() => switchMode('signin')}>Sign in</button></>
          }
        </p>
      </div>
    </div>
  );
}
