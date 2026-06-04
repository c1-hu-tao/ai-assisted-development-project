import { useState, useMemo } from 'react';
import { CATEGORIES, tagClass } from '../utils/helpers';

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

const ChevronIcon = ({ open }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function CategorySidebar({ recipes, selected, onSelect, onRandom, favouriteCount }) {
  const [expanded, setExpanded] = useState(null); // which main category is open

  const counts = useMemo(() => {
    const main = {}, sub = {};
    recipes.forEach(r => {
      if (r.category) {
        main[r.category] = (main[r.category] || 0) + 1;
        if (r.subcategory) {
          const k = `${r.category}>${r.subcategory}`;
          sub[k] = (sub[k] || 0) + 1;
        }
      }
    });
    return { main, sub };
  }, [recipes]);

  const isMainActive = (mainCat) =>
    selected && selected !== '__favourites__' && selected.main === mainCat && !selected.sub;

  const isSubActive = (mainCat, subCat) =>
    selected && selected !== '__favourites__' && selected.main === mainCat && selected.sub === subCat;

  const toggleExpand = (mainCat) =>
    setExpanded(prev => prev === mainCat ? null : mainCat);

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

      {/* Main categories */}
      {Object.entries(CATEGORIES).map(([mainCat, subs]) => {
        const mainCount = counts.main[mainCat] || 0;
        const isOpen = expanded === mainCat;

        return (
          <div key={mainCat} className="sidebar-group">
            <div
              className={`sidebar-item sidebar-item--main${isMainActive(mainCat) ? ' active' : ''}`}
              onClick={() => { onSelect({ main: mainCat }); toggleExpand(mainCat); }}
            >
              <span className="sidebar-chevron" onClick={e => { e.stopPropagation(); toggleExpand(mainCat); }}>
                <ChevronIcon open={isOpen} />
              </span>
              <span className="sidebar-item-name">{mainCat}</span>
              <div className="sidebar-item-right">
                {mainCount > 0 && <span className="sidebar-count">{mainCount}</span>}
                <button
                  className="shuffle-btn"
                  title={`Random ${mainCat} recipe`}
                  onClick={e => { e.stopPropagation(); onRandom(mainCat); }}
                ><ShuffleIcon /></button>
              </div>
            </div>

            {isOpen && (
              <div className="sidebar-subs">
                {subs.map(sub => {
                  const subCount = counts.sub[`${mainCat}>${sub}`] || 0;
                  return (
                    <div
                      key={sub}
                      className={`sidebar-item sidebar-item--sub${isSubActive(mainCat, sub) ? ' active' : ''}`}
                      onClick={() => onSelect({ main: mainCat, sub })}
                    >
                      <span className={`sidebar-sub-dot tag-dot ${tagClass(mainCat)}`} />
                      <span className="sidebar-item-name">{sub}</span>
                      {subCount > 0 && <span className="sidebar-count">{subCount}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
