import { useMemo } from 'react';

const ShuffleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8"/>
    <line x1="4" y1="20" x2="21" y2="3"/>
    <polyline points="21 16 21 21 16 21"/>
    <line x1="15" y1="15" x2="21" y2="21"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function CategorySidebar({ recipes, selected, onSelect, onRandom, favouriteCount }) {
  const categories = useMemo(() => {
    const counts = {};
    recipes.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [recipes]);

  return (
    <>
      <div className="sidebar-heading">Categories</div>

      {/* Favourites */}
      <div
        className={`sidebar-item${selected === '__favourites__' ? ' active' : ''}`}
        onClick={() => onSelect('__favourites__')}
      >
        <span className="sidebar-item-name sidebar-fav-label"><HeartIcon /> Favourites</span>
        <div className="sidebar-item-right">
          <span className="sidebar-count">{favouriteCount}</span>
        </div>
      </div>

      {/* All */}
      <div
        className={`sidebar-item${selected === null ? ' active' : ''}`}
        onClick={() => onSelect(null)}
      >
        <span className="sidebar-item-name">All</span>
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
