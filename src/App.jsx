import { useState, useEffect, useMemo } from 'react';
import { db } from './lib/supabase';
import { isTableMissing, normalizeIng } from './utils/helpers';
import AppHeader from './components/AppHeader';
import RecipeCard from './components/RecipeCard';
import SetupScreen from './components/SetupScreen';
import RecipeModal from './components/RecipeModal';
import CategorySidebar from './components/CategorySidebar';
import IngredientFilter from './components/IngredientFilter';
import RecipeForm from './components/RecipeForm';
import AuthModal from './components/AuthModal';

const FAV_KEY = (userId) => `recipe-favs-${userId ?? 'guest'}`;

function loadFavourites(userId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY(userId)) || '[]'));
  } catch { return new Set(); }
}

function saveFavourites(userId, set) {
  localStorage.setItem(FAV_KEY(userId), JSON.stringify([...set]));
}

export default function App() {
  const [recipes,             setRecipes]             = useState([]);
  const [status,              setStatus]              = useState('loading');
  const [errMsg,              setErrMsg]              = useState('');
  const [connected,           setConnected]           = useState(false);
  const [showForm,            setShowForm]            = useState(false);
  const [editingRecipe,       setEditingRecipe]       = useState(null);
  const [retryKey,            setRetryKey]            = useState(0);
  const [selectedCat,         setSelectedCat]         = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [randomRecipe,        setRandomRecipe]        = useState(null);
  const [viewingRecipe,       setViewingRecipe]       = useState(null);
  const [user,                setUser]                = useState(null);
  const [isAdmin,             setIsAdmin]             = useState(false);
  const [showAuth,            setShowAuth]            = useState(false);
  const [favourites,          setFavourites]          = useState(() => loadFavourites(null));

  // Track auth session and reload favourites when user changes
  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(u?.app_metadata?.role === 'admin');
      setFavourites(loadFavourites(u?.id));
    });
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(u?.app_metadata?.role === 'admin');
      setFavourites(loadFavourites(u?.id));
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load recipes and subscribe to real-time changes
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

  const toggleFavourite = (id) => {
    setFavourites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveFavourites(user?.id, next);
      return next;
    });
  };

  const addRecipe = async (r) => {
    if (!user) { setShowAuth(true); return; }
    const { error } = await db.from('recipes').insert([{
      title: r.title, description: r.description,
      category: r.category, ingredients: r.ingredients,
      search_ingredients: r.search_ingredients || [],
      instructions: r.instructions,
      photo_url: r.photo_url || null,
      owner_id: user.id,
    }]);
    if (error) alert('Could not save recipe: ' + error.message);
  };

  const updateRecipe = async (r) => {
    if (!user) return;
    let q = db.from('recipes').update({
      title: r.title, description: r.description,
      category: r.category, ingredients: r.ingredients,
      search_ingredients: r.search_ingredients || [],
      instructions: r.instructions,
      photo_url: r.photo_url ?? null,
    }).eq('id', r.id);
    if (!isAdmin) q = q.eq('owner_id', user.id);
    const { error } = await q;
    if (error) alert('Could not update recipe: ' + error.message);
  };

  const deleteRecipe = async (id) => {
    if (!user) return;
    let q = db.from('recipes').delete().eq('id', id);
    if (!isAdmin) q = q.eq('owner_id', user.id);
    const { error } = await q;
    if (error) { alert('Could not delete recipe: ' + error.message); return; }
    setFavourites(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      saveFavourites(user?.id, next);
      return next;
    });
  };

  const handleAddClick = () => {
    if (!user) { setShowAuth(true); return; }
    setShowForm(true);
  };

  const handleEditClick = (recipe) => {
    if (!user || (!isAdmin && user.id !== recipe.owner_id)) return;
    setEditingRecipe(recipe);
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
    let result = recipes;
    if (selectedCat === '__favourites__') {
      result = result.filter(r => favourites.has(r.id));
    } else if (selectedCat) {
      result = result.filter(r => r.category === selectedCat);
    }
    if (selectedIngredients.length > 0) {
      result = result.filter(r => recipeScores[r.id] > 0);
      result = [...result].sort((a, b) => recipeScores[b.id] - recipeScores[a.id]);
    }
    return result;
  }, [recipes, selectedCat, selectedIngredients, recipeScores, favourites]);

  const headerProps = { connected, user, onSignIn: () => setShowAuth(true) };

  if (status === 'loading') return (
    <>
      <AppHeader {...headerProps} />
      <main className="main">
        <div className="status-screen">
          <div className="spinner" />
          <span>Connecting to your recipe collection…</span>
        </div>
      </main>
    </>
  );

  if (status === 'setup') return (
    <><AppHeader {...headerProps} /><SetupScreen onRetry={retry} /></>
  );

  if (status === 'error') return (
    <>
      <AppHeader {...headerProps} />
      <main className="main">
        <div className="status-screen">
          <p className="err-text">Connection error: {errMsg}</p>
          <button className="btn btn-primary" onClick={retry}>Retry</button>
        </div>
      </main>
    </>
  );

  const emptyMsg = selectedCat === '__favourites__'
    ? 'No favourites yet — click the heart on any recipe.'
    : selectedCat
      ? `No ${selectedCat} recipes yet.`
      : 'No recipes yet — add your first one above.';

  return (
    <>
      <AppHeader {...headerProps} />
      <div className="app-body">
        <nav className="sidebar">
          <CategorySidebar
            recipes={recipes}
            selected={selectedCat}
            onSelect={setSelectedCat}
            onRandom={pickRandom}
            favouriteCount={favourites.size}
          />
          <IngredientFilter allIngredients={allIngredients} selected={selectedIngredients}
            onToggle={toggleIngredient} onClearAll={() => setSelectedIngredients([])} />
        </nav>
        <main className="content">
          <div className="toolbar">
            <span className="recipe-count">
              {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'}
              {selectedCat === '__favourites__' ? ' favourited' : selectedCat ? ` in ${selectedCat}` : ' saved'}
              {selectedIngredients.length > 0 ? ` • ${selectedIngredients.length} ingredient${selectedIngredients.length === 1 ? '' : 's'}` : ''}
            </span>
            <button className="btn btn-primary" onClick={handleAddClick}>
              + Add Recipe
            </button>
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">☕</div>
              <p>{emptyMsg}</p>
            </div>
          ) : (
            <div className="recipe-grid">
              {filteredRecipes.map(r => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onDelete={deleteRecipe}
                  onEdit={handleEditClick}
                  onView={setViewingRecipe}
                  matchCount={recipeScores[r.id]}
                  totalSelected={selectedIngredients.length}
                  isOwner={!!user && (isAdmin || user.id === r.owner_id)}
                  isFavourite={favourites.has(r.id)}
                  onToggleFavourite={toggleFavourite}
                />
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
          user={user}
        />
      )}
      {(randomRecipe || viewingRecipe) && (
        <RecipeModal
          recipe={randomRecipe ?? viewingRecipe}
          onClose={() => { setRandomRecipe(null); setViewingRecipe(null); }}
        />
      )}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </>
  );
}
