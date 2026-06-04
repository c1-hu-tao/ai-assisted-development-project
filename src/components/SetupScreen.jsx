import { useState } from 'react';
import { SETUP_SQL } from '../lib/supabase';

export default function SetupScreen({ onRetry }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(SETUP_SQL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main className="main">
      <div className="setup-card">
        <h2 className="setup-title">One-time Database Setup</h2>
        <p className="setup-sub">
          The <code>recipes</code> table doesn't exist yet in your Supabase project.
          Run the SQL below once and you're all set.
        </p>
        <ol className="setup-steps">
          <li>Open your <strong>Supabase dashboard</strong> and go to <strong>SQL Editor</strong></li>
          <li>Click <strong>New query</strong>, paste the SQL below, and run it</li>
          <li>Come back here and click <strong>Retry</strong></li>
        </ol>
        <div className="sql-wrap">
          <pre className="sql-block">{SETUP_SQL}</pre>
          <button className="sql-copy" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
        </div>
        <button className="btn btn-primary" onClick={onRetry}>Retry Connection</button>
      </div>
    </main>
  );
}
