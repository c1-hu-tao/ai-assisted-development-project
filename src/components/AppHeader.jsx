import { db } from '../lib/supabase';

export default function AppHeader({ connected, user, displayName, onSignIn, onEditProfile }) {
  const signOut = () => db.auth.signOut();

  return (
    <header className="header">
      <div className="header-inner">
        <p className="header-eyebrow">☕ Your Kitchen</p>
        <h1 className="header-title">Recipe Collection</h1>
        <p className="header-sub">A warm place for your favourite recipes</p>
        <div className="header-meta">
          <span className={`live-badge ${connected ? 'on' : ''}`}>
            <span className="live-dot" />
            {connected ? 'Live sync' : 'Connecting…'}
          </span>
          {user ? (
            <div className="auth-status">
              <button className="auth-name-btn" onClick={onEditProfile} title="Edit display name">
                {displayName || user.email}
              </button>
              <button className="auth-signout-btn" onClick={signOut}>Sign out</button>
            </div>
          ) : (
            <button className="auth-signin-btn" onClick={onSignIn}>Sign in</button>
          )}
        </div>
      </div>
    </header>
  );
}
