import React, { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import DetailModal from '../components/DetailModal';
import AIOutput from '../components/AIOutput';

export default function Personalities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', twinId: '', traits: '', communicationStyle: '', tone: '' });
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiForm, setAiForm] = useState({ twinId: '', name: '', description: '' });
  const [showAi, setShowAi] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/personalities');
      setItems(Array.isArray(data) ? data : data.personalities || data.data || []);
    } catch { toast.error('Failed to load personalities'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, traits: form.traits ? form.traits.split(',').map(t => t.trim()) : [] };
      await api.post('/personalities', payload);
      toast.success('Personality created!');
      setShowCreate(false);
      setForm({ name: '', description: '', twinId: '', traits: '', communicationStyle: '', tone: '' });
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleEdit = () => {
    setEditForm({ ...selected });
    setEditing(true);
    setSelected(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/personalities/${editForm._id || editForm.id}`, editForm);
      toast.success('Updated!');
      setEditing(false);
      fetchItems();
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const id = selected._id || selected.id;
    try {
      await api.delete(`/personalities/${id}`);
      toast.success('Deleted!');
      setSelected(null);
      fetchItems();
    } catch { toast.error('Failed to delete'); }
  };

  const handleAiGenerate = async () => {
    if (!aiForm.name) { toast.error('Name is required'); return; }
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data } = await api.post('/personalities/generate', aiForm);
      setAiResult(data);
      toast.success('Personality generated!');
    } catch { toast.error('Failed to generate personality'); }
    finally { setAiLoading(false); }
  };

  const filtered = items.filter(i =>
    (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>Personalities</h1>
        <div className="page-header-actions">
          <div className="search-input">
            <FiSearch />
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-ai" onClick={() => setShowAi(true)}><FiCpu /> AI Generate</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><FiPlus /> New Personality</button>
        </div>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : filtered.length === 0 ? (
        <div className="empty-state"><FiCpu style={{ fontSize: 48 }} /><h3>No personalities found</h3><p>Create a personality profile to get started.</p></div>
      ) : (
        <div className="items-grid">
          {filtered.map(item => (
            <div key={item._id || item.id} className="card card-clickable" onClick={() => setSelected(item)}>
              <div className="card-header">
                <div className="card-title">{item.name}</div>
                {item.tone && <span className="badge badge-primary">{item.tone}</span>}
              </div>
              <div className="card-body">
                <p>{item.description || 'No description'}</p>
                {item.traits && Array.isArray(item.traits) && (
                  <div className="tags-container mt-2">
                    {item.traits.slice(0, 4).map((t, i) => <span key={i} className="tag">{t}</span>)}
                    {item.traits.length > 4 && <span className="tag">+{item.traits.length - 4}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DetailModal isOpen={!!selected && !editing} onClose={() => setSelected(null)} title="Personality Details" data={selected} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-header"><h2>Create Personality</h2><button className="modal-close" onClick={() => setShowCreate(false)}>&times;</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label>Name *</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Personality name" /></div>
                <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this personality..." /></div>
                <div className="form-group"><label>Twin ID</label><input className="form-control" value={form.twinId} onChange={e => setForm({ ...form, twinId: e.target.value })} placeholder="Associated twin ID" /></div>
                <div className="form-row">
                  <div className="form-group"><label>Communication Style</label><input className="form-control" value={form.communicationStyle} onChange={e => setForm({ ...form, communicationStyle: e.target.value })} placeholder="e.g., formal, casual" /></div>
                  <div className="form-group"><label>Tone</label><input className="form-control" value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })} placeholder="e.g., friendly, professional" /></div>
                </div>
                <div className="form-group"><label>Traits (comma-separated)</label><input className="form-control" value={form.traits} onChange={e => setForm({ ...form, traits: e.target.value })} placeholder="e.g., empathetic, analytical, creative" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setEditing(false); }}>
          <div className="modal">
            <div className="modal-header"><h2>Edit Personality</h2><button className="modal-close" onClick={() => setEditing(false)}>&times;</button></div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group"><label>Name</label><input className="form-control" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div className="form-group"><label>Description</label><textarea className="form-control" value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Communication Style</label><input className="form-control" value={editForm.communicationStyle || ''} onChange={e => setEditForm({ ...editForm, communicationStyle: e.target.value })} /></div>
                  <div className="form-group"><label>Tone</label><input className="form-control" value={editForm.tone || ''} onChange={e => setEditForm({ ...editForm, tone: e.target.value })} /></div>
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

      {/* AI Generate Modal */}
      {showAi && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) { setShowAi(false); setAiResult(null); } }}>
          <div className="modal modal-lg">
            <div className="modal-header"><h2>AI Personality Generator</h2><button className="modal-close" onClick={() => { setShowAi(false); setAiResult(null); }}>&times;</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Twin ID</label><input className="form-control" value={aiForm.twinId} onChange={e => setAiForm({ ...aiForm, twinId: e.target.value })} placeholder="Twin ID" /></div>
              <div className="form-group"><label>Name *</label><input className="form-control" value={aiForm.name} onChange={e => setAiForm({ ...aiForm, name: e.target.value })} placeholder="Personality name" /></div>
              <div className="form-group"><label>Description</label><textarea className="form-control" value={aiForm.description} onChange={e => setAiForm({ ...aiForm, description: e.target.value })} placeholder="Brief description..." /></div>
              <button className="btn btn-ai" onClick={handleAiGenerate} disabled={aiLoading}><FiCpu /> {aiLoading ? 'Generating...' : 'Generate'}</button>
              <AIOutput data={aiResult} loading={aiLoading} title="Generated Personality" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
