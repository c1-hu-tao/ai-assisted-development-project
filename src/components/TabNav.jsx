export default function TabNav({ page, onSelect }) {
  return (
    <nav className="tab-nav">
      <button
        className={`tab-btn${page === 'recipes' ? ' tab-btn--active' : ''}`}
        onClick={() => onSelect('recipes')}
      >
        Recipes
      </button>
      <button
        className={`tab-btn${page === 'planner' ? ' tab-btn--active' : ''}`}
        onClick={() => onSelect('planner')}
      >
        Meal Planner
      </button>
    </nav>
  );
}
