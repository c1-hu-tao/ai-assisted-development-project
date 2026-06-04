import { useMemo } from 'react';

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
          <div className="sidebar-item-left">
            <button
              className="dice-btn"
              title={`Random ${cat} recipe`}
              onClick={e => { e.stopPropagation(); onRandom(cat); }}
            >🎲</button>
            <span>{cat}</span>
          </div>
          <span className="sidebar-count">{count}</span>
        </div>
      ))}
    </>
  );
}
