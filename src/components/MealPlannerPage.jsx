import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/supabase';
import MealSlotPicker from './MealSlotPicker';
import RecipeModal from './RecipeModal';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEALS = ['Breakfast','Lunch','Dinner','Snack'];

function getWeekStart(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date;
}

function weekKey(date) {
  return date.toISOString().slice(0, 10);
}

function addWeeks(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

function formatWeekLabel(date) {
  const end = addWeeks(date, 1);
  end.setDate(end.getDate() - 1);
  const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(date)} – ${fmt(end)}`;
}

export default function MealPlannerPage({ user, recipes, onAddRecipe, onSignIn }) {
  const [weekStart,   setWeekStart]   = useState(getWeekStart);
  const [planMap,     setPlanMap]     = useState({});
  const [loading,     setLoading]     = useState(false);
  const [activeSlot,  setActiveSlot]  = useState(null); // { day, mealType }
  const [viewingRecipe, setViewingRecipe] = useState(null);

  const slotKey = (day, mealType) => `${day}-${mealType}`;

  const loadPlan = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await db.from('meal_plans')
      .select('*, recipe:recipes(*)')
      .eq('user_id', user.id)
      .eq('week_start', weekKey(weekStart));
    if (data) {
      const map = {};
      data.forEach(e => { map[slotKey(e.day, e.meal_type)] = e; });
      setPlanMap(map);
    }
    setLoading(false);
  }, [user, weekStart]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const assignRecipe = async (day, mealType, recipe) => {
    if (!user) return;
    const { error } = await db.from('meal_plans').upsert({
      user_id: user.id,
      week_start: weekKey(weekStart),
      day,
      meal_type: mealType,
      recipe_id: recipe.id,
    }, { onConflict: 'user_id,week_start,day,meal_type' });
    if (error) { alert('Could not save: ' + error.message); return; }
    setPlanMap(prev => ({
      ...prev,
      [slotKey(day, mealType)]: { day, meal_type: mealType, recipe_id: recipe.id, recipe },
    }));
    setActiveSlot(null);
  };

  const removeSlot = async (day, mealType) => {
    if (!user) return;
    await db.from('meal_plans').delete()
      .eq('user_id', user.id)
      .eq('week_start', weekKey(weekStart))
      .eq('day', day)
      .eq('meal_type', mealType);
    setPlanMap(prev => {
      const next = { ...prev };
      delete next[slotKey(day, mealType)];
      return next;
    });
    setActiveSlot(null);
  };

  if (!user) return (
    <main className="main">
      <div className="status-screen">
        <p style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Sign in to use the Meal Planner.</p>
        <button className="btn btn-primary" onClick={onSignIn}>Sign in</button>
      </div>
    </main>
  );

  return (
    <main className="main planner-main">
      {/* Week navigation */}
      <div className="planner-header">
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(w => addWeeks(w, -1))}>← Prev</button>
        <span className="planner-week-label">{formatWeekLabel(weekStart)}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(w => addWeeks(w, 1))}>Next →</button>
      </div>

      {loading ? (
        <div className="status-screen" style={{ minHeight: '30vh' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="planner-grid-wrap">
          <table className="planner-grid">
            <thead>
              <tr>
                <th className="planner-th planner-th--meal" />
                {DAYS.map(d => (
                  <th key={d} className="planner-th">{d.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEALS.map(meal => (
                <tr key={meal}>
                  <td className="planner-meal-label">{meal}</td>
                  {DAYS.map((_, dayIdx) => {
                    const entry = planMap[slotKey(dayIdx, meal)];
                    return (
                      <td key={dayIdx} className="planner-cell">
                        {entry?.recipe ? (
                          <div className="planner-slot planner-slot--filled">
                            <button
                              className="planner-slot-recipe"
                              onClick={() => setViewingRecipe(entry.recipe)}
                            >
                              <span className="planner-slot-name">{entry.recipe.title}</span>
                            </button>
                            <button
                              className="planner-slot-change"
                              title="Change recipe"
                              onClick={() => setActiveSlot({ day: dayIdx, mealType: meal })}
                            >✎</button>
                          </div>
                        ) : (
                          <button
                            className="planner-slot"
                            onClick={() => setActiveSlot({ day: dayIdx, mealType: meal })}
                          >
                            <span className="planner-slot-empty">+</span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingRecipe && (
        <RecipeModal recipe={viewingRecipe} onClose={() => setViewingRecipe(null)} />
      )}

      {activeSlot && (
        <MealSlotPicker
          day={DAYS[activeSlot.day]}
          mealType={activeSlot.mealType}
          currentRecipe={planMap[slotKey(activeSlot.day, activeSlot.mealType)]?.recipe}
          recipes={recipes}
          user={user}
          onAssign={recipe => assignRecipe(activeSlot.day, activeSlot.mealType, recipe)}
          onRemove={() => removeSlot(activeSlot.day, activeSlot.mealType)}
          onSaveAndAssign={async (recipeData) => {
            const saved = await onAddRecipe(recipeData);
            if (saved) assignRecipe(activeSlot.day, activeSlot.mealType, saved);
          }}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </main>
  );
}
