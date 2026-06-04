export default function AppHeader({ connected }) {
  return (
    <header className="header">
      <div className="header-inner">
        <p className="header-eyebrow">☕ Your Kitchen</p>
        <h1 className="header-title">Recipe Collection</h1>
        <p className="header-sub">A warm place for your favourite recipes</p>
        <span className={`live-badge ${connected ? 'on' : ''}`}>
          <span className="live-dot" />
          {connected ? 'Live sync' : 'Connecting…'}
        </span>
      </div>
    </header>
  );
}
