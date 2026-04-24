import React, { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiBox, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import DetailModal from '../components/DetailModal';
import AIOutput from '../components/AIOutput';

export default function MemorySystem() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ content: '', type: 'episodic', twinId: '', importance: 0.5, context: '', tags: '' });
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiMemory, setAiMemory] = useState('');

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/memories');
      setItems(Array.isArray(data) ? data : data.memories || data.data || []);
    } catch { toast.error('Failed to load memories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.content) { toast.error('Content is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [], importance: parseFloat(form.importance) };
      await api.post('/memories', payload);
      toast.success('Memory created!');
      setShowCreate(false);
      setForm({ content: '', type: 'episodic', twinId: '', importance: 0.5, context: '', tags: '' });
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleEdit = () => { setEditForm({ ...selected }); setEditing(true); setSelected(null); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/memories/${editForm._id || editForm.id}`, editForm);
      toast.success('Updated!');
      setEditing(false);
      fetchItems();
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/memories/${selected._id || selected.id}`);
      toast.success('Deleted!');
      setSelected(null);
      fetchItems();
    } catch { toast.error('Failed to delete'); }
  };

  const handleAssessImportance = async () => {
    if (!aiMemory.trim()) { toast.error('Enter memory content to assess'); return; }
    setAiLoading(true); setAiResult(null);
    try {
      const { data } = await api.post('/memories/assess-importance', { content: aiMemory, memory: aiMemory });
      setAiResult(data);
      toast.success('Assessment complete!');
    } catch { toast.error('Failed to assess importance'); }
    finally { setAiLoading(false); }
  };

  const typeColors = { episodic: 'badge-primary', semantic: 'badge-accent', procedural: 'badge-secondary' };
  const memoryTypes = ['all', 'episodic', 'semantic', 'procedural'];

  const filtered = items.filter(i => {
    const matchSearch = (i.content || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || i.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Memory System</h1>
        <div className="page-header-actions">
          <div className="search-input"><FiSearch /><input placeholder="Search memories..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><FiPlus /> New Memory</button>
        </div>
      </div>

      <div className="filter-bar">
        {memoryTypes.map(type => (
          <button key={type} className={`filter-chip ${typeFilter === type ? 'active' : ''}`} onClick={() => setTypeFilter(type)}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* AI Assess Section */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">Assess Memory Importance</div>
          <span className="badge badge-accent">AI Powered</span>
        </div>
        <div className="card-body">
          <textarea className="form-control" value={aiMemory} onChange={e => setAiMemory(e.target.value)} placeholder="Enter memory content to assess importance..." style={{ minHeight: 80, marginBottom: 14 }} />
          <button className="btn btn-ai" onClick={handleAssessImportance} disabled={aiLoading}><FiCpu /> {aiLoading ? 'Assessing...' : 'Assess Importance'}</button>
        </div>
        <AIOutput data={aiResult} loading={aiLoading} title="Importance Assessment" />
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : filtered.length === 0 ? (
        <div className="empty-state"><FiBox style={{ fontSize: 48 }} /><h3>No memories found</h3><p>Create memories for your digital twins.</p></div>
      ) : (
        <div className="items-grid">
          {filtered.map(item => (
            <div key={item._id || item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <span className={`badge ${typeColors[item.type] || 'badge-primary'}`}>{item.type || 'episodic'}</span>
                {item.importance != null && (
                  <span className="text-sm text-muted">Importance: {typeof item.importance === 'number' ? (item.importance * 100).toFixed(0) + '%' : item.importance}</span>
                )}
              </div>
              <div className="card-body">
                <p>{(item.content || '').slice(0, 150)}{(item.content || '').length > 150 ? '...' : ''}</p>
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

      <DetailModal isOpen={!!selected && !editing} onClose={() => setSelected(null)} title="Memory Details" data={selected} onEdit={handleEdit} onDelete={handleDelete} />

      {showCreate && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-header"><h2>Create Memory</h2><button className="modal-close" onClick={() => setShowCreate(false)}>&times;</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label>Content *</label><textarea className="form-control" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Memory content..." style={{ minHeight: 120 }} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Type</label>
                    <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="episodic">Episodic</option>
                      <option value="semantic">Semantic</option>
                      <option value="procedural">Procedural</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Importance (0-1)</label><input className="form-control" type="number" step="0.1" min="0" max="1" value={form.importance} onChange={e => setForm({ ...form, importance: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Twin ID</label><input className="form-control" value={form.twinId} onChange={e => setForm({ ...form, twinId: e.target.value })} placeholder="Associated twin" /></div>
                <div className="form-group"><label>Context</label><input className="form-control" value={form.context} onChange={e => setForm({ ...form, context: e.target.value })} placeholder="Memory context" /></div>
                <div className="form-group"><label>Tags (comma-separated)</label><input className="form-control" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2" /></div>
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
            <div className="modal-header"><h2>Edit Memory</h2><button className="modal-close" onClick={() => setEditing(false)}>&times;</button></div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group"><label>Content</label><textarea className="form-control" value={editForm.content || ''} onChange={e => setEditForm({ ...editForm, content: e.target.value })} style={{ minHeight: 120 }} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Type</label>
                    <select className="form-control" value={editForm.type || 'episodic'} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                      <option value="episodic">Episodic</option>
                      <option value="semantic">Semantic</option>
                      <option value="procedural">Procedural</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Importance</label><input className="form-control" type="number" step="0.1" min="0" max="1" value={editForm.importance || ''} onChange={e => setEditForm({ ...editForm, importance: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Context</label><input className="form-control" value={editForm.context || ''} onChange={e => setEditForm({ ...editForm, context: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
