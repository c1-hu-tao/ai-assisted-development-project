import { useState, useRef } from 'react';
import { normalizeIng } from '../utils/helpers';
import { db } from '../lib/supabase';

export default function RecipeForm({ initialData, onSave, onClose, user }) {
  const isEdit = !!initialData?.id;
  const [title, setTitle]               = useState(initialData?.title || '');
  const [desc, setDesc]                 = useState(initialData?.description || '');
  const [category, setCategory]         = useState(initialData?.category || 'Baking');
  const [ingredients, setIngredients]   = useState(initialData?.ingredients || []);
  const [searchTags, setSearchTags]     = useState(() => {
    if (!initialData) return [];
    const tags = initialData.search_ingredients || [];
    return tags.length > 0 ? tags : (initialData.ingredients || []).map(normalizeIng);
  });
  const [ingInput, setIngInput]         = useState('');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState(initialData?.photo_url || null);
  const [uploading, setUploading]       = useState(false);
  const ingRef  = useRef(null);
  const fileRef = useRef(null);

  const commitIng = () => {
    const v = ingInput.trim();
    if (!v) return;
    setIngredients(prev => [...prev, v]);
    setSearchTags(prev => [...prev, '']);
    setIngInput('');
    ingRef.current?.focus();
  };

  const removeIng = (i) => {
    setIngredients(prev => prev.filter((_, j) => j !== i));
    setSearchTags(prev => prev.filter((_, j) => j !== i));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const uploadPhoto = async () => {
    if (!photoFile || !user) return null;
    const ext  = photoFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await db.storage.from('recipe-photos').upload(path, photoFile, { upsert: true });
    if (error) { alert('Photo upload failed: ' + error.message); return null; }
    const { data } = db.storage.from('recipe-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setUploading(true);

    let photo_url = photoPreview && !photoFile ? photoPreview : null; // keep existing URL if no new file
    if (photoFile) photo_url = await uploadPhoto();

    onSave({
      ...(isEdit ? { id: initialData.id } : {}),
      title: title.trim(), description: desc.trim(), category, ingredients,
      search_ingredients: searchTags.map(t => t.trim()).filter(Boolean),
      instructions: instructions.trim(),
      photo_url,
    });
    setUploading(false);
    onClose();
  };

  return (
    <div className="overlay">
      <div className="form-card">
        <h2 className="form-heading">{isEdit ? 'Edit Recipe' : 'Add New Recipe'}</h2>
        <form onSubmit={handleSubmit}>

          {/* Photo */}
          <div className="form-group">
            <label className="form-label">Photo</label>
            {photoPreview ? (
              <div className="photo-preview-wrap">
                <img src={photoPreview} alt="Recipe preview" className="photo-preview" />
                <button type="button" className="photo-remove" onClick={removePhoto}>✕ Remove</button>
              </div>
            ) : (
              <button type="button" className="photo-upload-btn" onClick={() => fileRef.current?.click()}>
                + Add Photo
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-ctrl" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Lavender Shortbread Cookies" required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Short Description</label>
            <input className="form-ctrl" value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="A single enticing sentence about this dish" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-ctrl" value={category} onChange={e => setCategory(e.target.value)}>
              <option>Appetizers</option><option>Baking</option><option>Breakfast</option>
              <option>Desserts</option><option>Drinks</option><option>Main Course</option>
              <option>Meats</option><option>Pasta</option><option>Pastries</option>
              <option>Salads</option><option>Seafood</option><option>Side Dishes</option>
              <option>Snacks</option><option>Soups</option><option>Vegetarian</option><option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Ingredients</label>
              <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontStyle: 'italic' }}>full text · filter name →</span>
            </div>
            <div className="ing-builder">
              {ingredients.map((ing, i) => (
                <div key={i} className="ing-chip">
                  <span className="ing-chip-label" title={ing}>{ing}</span>
                  <input
                    className="ing-search-tag"
                    value={searchTags[i] || ''}
                    onChange={e => setSearchTags(prev => prev.map((t, j) => j === i ? e.target.value : t))}
                    placeholder="e.g. egg"
                    title="Searchable name used in the ingredient filter"
                  />
                  <button type="button" className="ing-remove" onClick={() => removeIng(i)}>×</button>
                </div>
              ))}
              <div className="ing-add-row">
                <input className="form-ctrl" ref={ingRef} value={ingInput}
                  onChange={e => setIngInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitIng(); } }}
                  placeholder="e.g. 2 cups flour — Enter to add" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={commitIng}
                  style={{ whiteSpace: 'nowrap' }}>+ Add</button>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Instructions</label>
            <textarea className="form-ctrl" value={instructions} onChange={e => setInstructions(e.target.value)}
              placeholder="Walk through the steps. Blank lines create natural paragraph breaks." rows={6} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
