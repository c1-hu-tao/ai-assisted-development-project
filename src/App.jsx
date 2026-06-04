import { useState, useEffect, useMemo, useRef } from 'react';
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
import AISuggestScreen from './components/AISuggestScreen';
import ProfileModal from './components/ProfileModal';
import MealPlannerPage from './components/MealPlannerPage';
import TabNav from './components/TabNav';

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
  const userIdRef = useRef(null);
  const [showAuth,            setShowAuth]            = useState(false);
  const [favourites,          setFavourites]          = useState(() => loadFavourites(null));
  const [tab,                 setTab]                 = useState('recipes'); // 'recipes' | 'planner'
  const [page,                setPage]                = useState('recipes'); // 'recipes' | 'suggest'
  const [suggestedRecipe,     setSuggestedRecipe]     = useState(null);
  const [profiles,            setProfiles]            = useState({});
  const [showProfile,         setShowProfile]         = useState(false);

  const upsertProfile = async (u) => {
    if (!u) return;
    // ignoreDuplicates: true — only insert on first login, never overwrite a name the user set via ProfileModal
    const { error } = await db.from('profiles').upsert(
      { id: u.id, name: u.user_metadata?.name || u.email.split('@')[0] },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (error) console.warn('Profile upsert failed:', error.message);
  };

  const fetchProfiles = async (recipes) => {
    const ids = [...new Set(recipes.filter(r => r.owner_id).map(r => r.owner_id))];
    if (ids.length === 0) return;
    const { data } = await db.from('profiles').select('id, name').in('id', ids);
    if (data) setProfiles(prev => {
      const next = { ...prev };
      data.forEach(p => { next[p.id] = p.name; });
      return next;
    });
  };

  // Track auth session and reload favourites when user changes
  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(u?.app_metadata?.role === 'admin');
      userIdRef.current = u?.id ?? null;
      setFavourites(loadFavourites(u?.id));
      upsertProfile(u);
    });
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setIsAdmin(u?.app_metadata?.role === 'admin');
      userIdRef.current = u?.id ?? null;
      setFavourites(loadFavourites(u?.id));
      upsertProfile(u);
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
      fetchProfiles(data);

      // Purge any favourites that no longer exist in the DB
      const existingIds = new Set(data.map(r => r.id));
      setFavourites(prev => {
        const cleaned = new Set([...prev].filter(id => existingIds.has(id)));
        if (cleaned.size !== prev.size) saveFavourites(userIdRef.current, cleaned);
        return cleaned;
      });

      channel = db.channel(`recipes-${retryKey}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'recipes' },
          ({ new: r }) => { if (!dead) { setRecipes(prev => [r, ...prev]); fetchProfiles([r]); } }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'recipes' },
          ({ new: r }) => { if (!dead) setRecipes(prev => prev.map(x => x.id === r.id ? r : x)); }
        )
        .on('postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'recipes' },
          ({ old: r }) => {
            if (dead) return;
            setRecipes(prev => prev.filter(x => x.id !== r.id));
            setFavourites(prev => {
              if (!prev.has(r.id)) return prev;
              const next = new Set(prev);
              next.delete(r.id);
              saveFavourites(userIdRef.current, next);
              return next;
            });
          }
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
    if (!user) { setShowAuth(true); return null; }
    const { data, error } = await db.from('recipes').insert([{
      title: r.title, description: r.description,
      category: r.category, subcategory: r.subcategory || '',
      ingredients: r.ingredients,
      search_ingredients: r.search_ingredients || [],
      instructions: r.instructions,
      photo_url: r.photo_url || null,
      owner_id: user.id,
      is_ai_generated: r.is_ai_generated || false,
    }]).select().single();
    if (error) { alert('Could not save recipe: ' + error.message); return null; }
    return data;
  };

  const updateRecipe = async (r) => {
    if (!user) return;
    let q = db.from('recipes').update({
      title: r.title, description: r.description,
      category: r.category, subcategory: r.subcategory || '',
      ingredients: r.ingredients,
      search_ingredients: r.search_ingredients || [],
      instructions: r.instructions,
      photo_url: r.photo_url ?? null,
      is_ai_generated: r.is_ai_generated || false,
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
      saveFavourites(userIdRef.current, next);
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

  const closeForm = () => { setShowForm(false); setEditingRecipe(null); setSuggestedRecipe(null); };

  const pickRandom = (mainCat) => {
    const pool = recipes.filter(r => r.category === mainCat);
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
      result = result.filter(r => r.category === selectedCat.main);
      if (selectedCat.sub) result = result.filter(r => r.subcategory === selectedCat.sub);
    }
    if (selectedIngredients.length > 0) {
      result = result.filter(r => recipeScores[r.id] > 0);
      result = [...result].sort((a, b) => recipeScores[b.id] - recipeScores[a.id]);
    }
    return result;
  }, [recipes, selectedCat, selectedIngredients, recipeScores, favourites]);

  const handleSuggest = (recipeData) => {
    setSuggestedRecipe({ ...recipeData, is_ai_generated: true });
    setPage('recipes');
    setShowForm(true);
  };

  const headerProps = {
    connected, user,
    displayName: user ? profiles[user.id] : null,
    onSignIn: () => setShowAuth(true),
    onEditProfile: () => setShowProfile(true),
  };

  const modals = (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showProfile && user && (
        <ProfileModal
          user={user}
          currentName={profiles[user.id]}
          onClose={() => setShowProfile(false)}
          onSaved={name => setProfiles(prev => ({ ...prev, [user.id]: name }))}
        />
      )}
    </>
  );

  if (page === 'suggest') return (
    <>
      <AppHeader {...headerProps} />
      <TabNav page="recipes" onSelect={p => { setTab(p); setPage('recipes'); }} />
      <AISuggestScreen
        onSuggest={handleSuggest}
        onBack={() => setPage('recipes')}
        user={user}
        onSignIn={() => setShowAuth(true)}
      />
      {modals}
    </>
  );

  if (tab === 'planner') return (
    <>
      <AppHeader {...headerProps} />
      <TabNav page={tab} onSelect={setTab} />
      <MealPlannerPage
        user={user}
        recipes={recipes}
        onAddRecipe={addRecipe}
        onSignIn={() => setShowAuth(true)}
      />
      {modals}
    </>
  );

  const catLabel = selectedCat === '__favourites__' ? null
    : selectedCat?.sub ? `${selectedCat.main} › ${selectedCat.sub}`
    : selectedCat?.main ?? null;

  const emptyMsg = selectedCat === '__favourites__'
    ? 'No favourites yet — click the heart on any recipe.'
    : catLabel
      ? `No ${catLabel} recipes yet.`
      : 'No recipes yet — add your first one above.';

  return (
    <>
      <AppHeader {...headerProps} />
      <TabNav page={tab} onSelect={setTab} />
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
              {selectedCat === '__favourites__' ? ' favourited' : catLabel ? ` in ${catLabel}` : ' saved'}
              {selectedIngredients.length > 0 ? ` • ${selectedIngredients.length} ingredient${selectedIngredients.length === 1 ? '' : 's'}` : ''}
            </span>
            <div className="toolbar-actions">
              <button className="btn btn-ghost" onClick={() => setPage('suggest')}>
                ✦ Suggest Recipe
              </button>
              <button className="btn btn-primary" onClick={handleAddClick}>
                + Add Recipe
              </button>
            </div>
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
                  creatorName={r.owner_id ? profiles[r.owner_id] : null}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {(showForm || editingRecipe) && (
        <RecipeForm
          initialData={editingRecipe ?? suggestedRecipe}
          onSave={editingRecipe ? updateRecipe : addRecipe}
          onClose={closeForm}
          user={user}
        />
      )}
      {(randomRecipe || viewingRecipe) && (
        <RecipeModal
          recipe={randomRecipe ?? viewingRecipe}
          onClose={() => { setRandomRecipe(null); setViewingRecipe(null); }}
          creatorName={(randomRecipe ?? viewingRecipe)?.owner_id ? profiles[(randomRecipe ?? viewingRecipe).owner_id] : null}
        />
      )}
      {modals}
    </>
  );
}
