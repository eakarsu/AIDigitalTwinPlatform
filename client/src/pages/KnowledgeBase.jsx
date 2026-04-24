import React, { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiDatabase, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import DetailModal from '../components/DetailModal';
import AIOutput from '../components/AIOutput';

export default function KnowledgeBase() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: '', source: '', twinId: '', tags: '' });
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAi, setShowAi] = useState(false);
  const [aiForm, setAiForm] = useState({ topic: '', category: '', twinId: '' });
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/knowledge');
      setItems(Array.isArray(data) ? data : data.knowledge || data.data || []);
    } catch { toast.error('Failed to load knowledge'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
      await api.post('/knowledge', payload);
      toast.success('Knowledge entry created!');
      setShowCreate(false);
      setForm({ title: '', content: '', category: '', source: '', twinId: '', tags: '' });
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleEdit = () => { setEditForm({ ...selected }); setEditing(true); setSelected(null); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/knowledge/${editForm._id || editForm.id}`, editForm);
      toast.success('Updated!');
      setEditing(false);
      fetchItems();
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/knowledge/${selected._id || selected.id}`);
      toast.success('Deleted!');
      setSelected(null);
      fetchItems();
    } catch { toast.error('Failed to delete'); }
  };

  const handleAiGenerate = async () => {
    if (!aiForm.topic) { toast.error('Topic is required'); return; }
    setAiLoading(true); setAiResult(null);
    try {
      const { data } = await api.post('/knowledge/generate', aiForm);
      setAiResult(data);
      toast.success('Knowledge generated!');
    } catch { toast.error('Failed to generate'); }
    finally { setAiLoading(false); }
  };

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  const filtered = items.filter(i => {
    const matchSearch = (i.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.content || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || i.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Knowledge Base</h1>
        <div className="page-header-actions">
          <div className="search-input"><FiSearch /><input placeholder="Search knowledge..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-ai" onClick={() => setShowAi(true)}><FiCpu /> Generate Knowledge</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><FiPlus /> New Entry</button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="filter-bar">
          <button className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>All</button>
          {categories.map(cat => (
            <button key={cat} className={`filter-chip ${categoryFilter === cat ? 'active' : ''}`} onClick={() => setCategoryFilter(cat)}>{cat}</button>
          ))}
        </div>
      )}

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : filtered.length === 0 ? (
        <div className="empty-state"><FiDatabase style={{ fontSize: 48 }} /><h3>No knowledge entries</h3><p>Add knowledge to train your digital twins.</p></div>
      ) : (
        <div className="items-grid">
          {filtered.map(item => (
            <div key={item._id || item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <div className="card-title">{item.title}</div>
                {item.category && <span className="badge badge-accent">{item.category}</span>}
              </div>
              <div className="card-body">
                <p>{(item.content || '').slice(0, 120)}{(item.content || '').length > 120 ? '...' : ''}</p>
                {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div className="tags-container mt-2">
                    {item.tags.slice(0, 3).map((t, i) => <span key={i} className="tag">{t}</span>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DetailModal isOpen={!!selected && !editing} onClose={() => setSelected(null)} title="Knowledge Details" data={selected} onEdit={handleEdit} onDelete={handleDelete} />

      {showCreate && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-header"><h2>Create Knowledge Entry</h2><button className="modal-close" onClick={() => setShowCreate(false)}>&times;</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label>Title *</label><input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Entry title" /></div>
                <div className="form-group"><label>Content</label><textarea className="form-control" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Knowledge content..." style={{ minHeight: 150 }} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Category</label><input className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g., Technical" /></div>
                  <div className="form-group"><label>Source</label><input className="form-control" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Source URL or reference" /></div>
                </div>
                <div className="form-group"><label>Twin ID</label><input className="form-control" value={form.twinId} onChange={e => setForm({ ...form, twinId: e.target.value })} placeholder="Associated twin" /></div>
                <div className="form-group"><label>Tags (comma-separated)</label><input className="form-control" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2, tag3" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setEditing(false); }}>
          <div className="modal">
            <div className="modal-header"><h2>Edit Knowledge Entry</h2><button className="modal-close" onClick={() => setEditing(false)}>&times;</button></div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group"><label>Title</label><input className="form-control" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
                <div className="form-group"><label>Content</label><textarea className="form-control" value={editForm.content || ''} onChange={e => setEditForm({ ...editForm, content: e.target.value })} style={{ minHeight: 150 }} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Category</label><input className="form-control" value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} /></div>
                  <div className="form-group"><label>Source</label><input className="form-control" value={editForm.source || ''} onChange={e => setEditForm({ ...editForm, source: e.target.value })} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAi && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) { setShowAi(false); setAiResult(null); } }}>
          <div className="modal modal-lg">
            <div className="modal-header"><h2>Generate Knowledge</h2><button className="modal-close" onClick={() => { setShowAi(false); setAiResult(null); }}>&times;</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Topic *</label><input className="form-control" value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })} placeholder="Knowledge topic" /></div>
              <div className="form-row">
                <div className="form-group"><label>Category</label><input className="form-control" value={aiForm.category} onChange={e => setAiForm({ ...aiForm, category: e.target.value })} placeholder="Category" /></div>
                <div className="form-group"><label>Twin ID</label><input className="form-control" value={aiForm.twinId} onChange={e => setAiForm({ ...aiForm, twinId: e.target.value })} placeholder="Twin ID" /></div>
              </div>
              <button className="btn btn-ai" onClick={handleAiGenerate} disabled={aiLoading}><FiCpu /> {aiLoading ? 'Generating...' : 'Generate'}</button>
              <AIOutput data={aiResult} loading={aiLoading} title="Generated Knowledge" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
