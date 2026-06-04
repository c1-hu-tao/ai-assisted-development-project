import { useState, useEffect, useMemo } from 'react';
import { db } from './lib/supabase';
import { isTableMissing, normalizeIng } from './utils/helpers';
import AppHeader from './components/AppHeader';
import RecipeCard from './components/RecipeCard';
import SetupScreen from './components/SetupScreen';
import RandomRecipeModal from './components/RandomRecipeModal';
import CategorySidebar from './components/CategorySidebar';
import IngredientFilter from './components/IngredientFilter';
import RecipeForm from './components/RecipeForm';

export default function App() {
  const [recipes,             setRecipes]             = useState([]);
  const [status,              setStatus]              = useState('loading'); // loading | setup | error | ready
  const [errMsg,              setErrMsg]              = useState('');
  const [connected,           setConnected]           = useState(false);
  const [showForm,            setShowForm]            = useState(false);
  const [editingRecipe,       setEditingRecipe]       = useState(null);
  const [retryKey,            setRetryKey]            = useState(0);
  const [selectedCat,         setSelectedCat]         = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [randomRecipe,        setRandomRecipe]        = useState(null);

  useEffect(() => {
    let channel = null;
    let dead    = false;

    async function init() {
      setStatus('loading');
      setConnected(false);

      const { data, error } = await db
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (dead) return;

      if (error) {
        if (isTableMissing(error)) { setStatus('setup'); }
        else { setErrMsg(error.message); setStatus('error'); }
        return;
      }

      if (dead) return;
      setRecipes(data);
      setStatus('ready');

      channel = db.channel(`recipes-${retryKey}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'recipes' },
          ({ new: r }) => { if (!dead) setRecipes(prev => [r, ...prev]); }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'recipes' },
          ({ new: r }) => { if (!dead) setRecipes(prev => prev.map(x => x.id === r.id ? r : x)); }
        )
        .on('postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'recipes' },
          ({ old: r }) => { if (!dead) setRecipes(prev => prev.filter(x => x.id !== r.id)); }
        )
        .subscribe(s => { if (!dead) setConnected(s === 'SUBSCRIBED'); });
    }

    init();
    return () => {
      dead = true;
      if (channel) { db.removeChannel(channel); }
    };
  }, [retryKey]);

  const addRecipe = async (r) => {
    const { error } = await db.from('recipes').insert([{
      title: r.title, description: r.description,
      category: r.category, ingredients: r.ingredients,
      search_ingredients: r.search_ingredients || [],
      instructions: r.instructions,
    }]);
    if (error) alert('Could not save recipe: ' + error.message);
  };

  const updateRecipe = async (r) => {
    const { error } = await db.from('recipes').update({
      title: r.title, description: r.description,
      category: r.category, ingredients: r.ingredients,
      search_ingredients: r.search_ingredients || [],
      instructions: r.instructions,
    }).eq('id', r.id);
    if (error) alert('Could not update recipe: ' + error.message);
  };

  const deleteRecipe = async (id) => {
    const { error } = await db.from('recipes').delete().eq('id', id);
    if (error) alert('Could not delete recipe: ' + error.message);
  };

  const closeForm = () => { setShowForm(false); setEditingRecipe(null); };

  const pickRandom = (cat) => {
    const pool = recipes.filter(r => r.category === cat);
    if (pool.length === 0) return;
    setRandomRecipe(pool[Math.floor(Math.random() * pool.length)]);
  };

  const retry = () => setRetryKey(k => k + 1);

  const allIngredients = useMemo(() => {
    const set = new Set();
    recipes.forEach(r => {
      const tags = Array.isArray(r.search_ingredients) ? r.search_ingredients : [];
      if (tags.length > 0) {
        tags.forEach(t => { if (t && t.trim()) set.add(t.trim().toLowerCase()); });
      } else {
        (r.ingredients || []).forEach(ing => {
          const n = normalizeIng(ing);
          if (n && n.length > 1) set.add(n);
        });
      }
    });
    return Array.from(set).sort();
  }, [recipes]);

  const toggleIngredient = (ing) => {
    setSelectedIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const recipeScores = useMemo(() => {
    const scores = {};
    recipes.forEach(r => {
      const tags = Array.isArray(r.search_ingredients) && r.search_ingredients.length > 0
        ? r.search_ingredients.map(t => t.trim().toLowerCase())
        : (r.ingredients || []).map(normalizeIng).filter(Boolean);
      const matchCount = selectedIngredients.filter(sel => tags.includes(sel)).length;
      scores[r.id] = matchCount;
    });
    return scores;
  }, [recipes, selectedIngredients]);

  const filteredRecipes = useMemo(() => {
    let result = selectedCat ? recipes.filter(r => r.category === selectedCat) : recipes;
    if (selectedIngredients.length > 0) {
      result = result.filter(r => recipeScores[r.id] > 0);
      result = result.sort((a, b) => recipeScores[b.id] - recipeScores[a.id]);
    }
    return result;
  }, [recipes, selectedCat, selectedIngredients, recipeScores]);

  if (status === 'loading') return (
    <>
      <AppHeader connected={false} />
      <main className="main">
        <div className="status-screen">
          <div className="spinner" />
          <span>Connecting to your recipe collection…</span>
        </div>
      </main>
    </>
  );

  if (status === 'setup') return (
    <><AppHeader connected={false} /><SetupScreen onRetry={retry} /></>
  );

  if (status === 'error') return (
    <>
      <AppHeader connected={false} />
      <main className="main">
        <div className="status-screen">
          <p className="err-text">Connection error: {errMsg}</p>
          <button className="btn btn-primary" onClick={retry}>Retry</button>
        </div>
      </main>
    </>
  );

  return (
    <>
      <AppHeader connected={connected} />
      <div className="app-body">
        <nav className="sidebar">
          <CategorySidebar recipes={recipes} selected={selectedCat} onSelect={setSelectedCat} onRandom={pickRandom} />
          <IngredientFilter allIngredients={allIngredients} selected={selectedIngredients}
            onToggle={toggleIngredient} onClearAll={() => setSelectedIngredients([])} />
        </nav>
        <main className="content">
          <div className="toolbar">
            <span className="recipe-count">
              {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'}
              {selectedCat ? ` in ${selectedCat}` : ' saved'}
              {selectedIngredients.length > 0 ? ` • ${selectedIngredients.length} ingredient${selectedIngredients.length === 1 ? '' : 's'}` : ''}
            </span>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Add Recipe
            </button>
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">☕</div>
              <p>{selectedCat ? `No ${selectedCat} recipes yet.` : 'No recipes yet — add your first one above.'}</p>
            </div>
          ) : (
            <div className="recipe-grid">
              {filteredRecipes.map(r => (
                <RecipeCard key={r.id} recipe={r} onDelete={deleteRecipe} onEdit={setEditingRecipe}
                  matchCount={recipeScores[r.id]} totalSelected={selectedIngredients.length} />
              ))}
            </div>
          )}
        </main>
      </div>

      {(showForm || editingRecipe) && (
        <RecipeForm
          initialData={editingRecipe}
          onSave={editingRecipe ? updateRecipe : addRecipe}
          onClose={closeForm}
        />
      )}
      {randomRecipe && (
        <RandomRecipeModal recipe={randomRecipe} onClose={() => setRandomRecipe(null)} />
      )}
    </>
  );
}
