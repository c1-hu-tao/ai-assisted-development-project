import { useMemo } from 'react';

const ShuffleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8"/>
    <line x1="4" y1="20" x2="21" y2="3"/>
    <polyline points="21 16 21 21 16 21"/>
    <line x1="15" y1="15" x2="21" y2="21"/>
  </svg>
);

export default function CategorySidebar({ recipes, selected, onSelect, onRandom }) {
  const categories = useMemo(() => {
    const counts = {};
    recipes.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [recipes]);

  return (
    <>
      <div className="sidebar-heading">Categories</div>
      <div
        className={`sidebar-item${selected === null ? ' active' : ''}`}
        onClick={() => onSelect(null)}
      >
        <span>All</span>
        <span className="sidebar-count">{recipes.length}</span>
      </div>
      {categories.map(([cat, count]) => (
        <div
          key={cat}
          className={`sidebar-item${selected === cat ? ' active' : ''}`}
          onClick={() => onSelect(cat)}
        >
          <span className="sidebar-item-name">{cat}</span>
          <div className="sidebar-item-right">
            <span className="sidebar-count">{count}</span>
            <button
              className="shuffle-btn"
              title={`Random ${cat} recipe`}
              onClick={e => { e.stopPropagation(); onRandom(cat); }}
            ><ShuffleIcon /></button>
          </div>
        </div>
      ))}
    </>
  );
}
