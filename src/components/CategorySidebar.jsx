import { useState, useMemo } from 'react';
import { CATEGORIES, tagClass } from '../utils/helpers';
import { HeartIcon, ShuffleIcon, ChevronIcon } from './icons';

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
        <span className="sidebar-item-name sidebar-fav-label"><HeartIcon filled /> Favourites</span>
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
