import React, { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiActivity, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import DetailModal from '../components/DetailModal';
import AIOutput from '../components/AIOutput';

export default function BehaviorPatterns() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', twinId: '', pattern: '', category: '', triggers: '' });
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAi, setShowAi] = useState(false);
  const [aiForm, setAiForm] = useState({ twinId: '', context: '', behaviorData: '' });

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/behaviors');
      setItems(Array.isArray(data) ? data : data.behaviors || data.data || []);
    } catch { toast.error('Failed to load behaviors'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, triggers: form.triggers ? form.triggers.split(',').map(t => t.trim()) : [] };
      await api.post('/behaviors', payload);
      toast.success('Behavior pattern created!');
      setShowCreate(false);
      setForm({ name: '', description: '', twinId: '', pattern: '', category: '', triggers: '' });
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleEdit = () => { setEditForm({ ...selected }); setEditing(true); setSelected(null); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/behaviors/${editForm._id || editForm.id}`, editForm);
      toast.success('Updated!');
      setEditing(false);
      fetchItems();
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/behaviors/${selected._id || selected.id}`);
      toast.success('Deleted!');
      setSelected(null);
      fetchItems();
    } catch { toast.error('Failed to delete'); }
  };

  const handleAiAnalyze = async () => {
    setAiLoading(true); setAiResult(null);
    try {
      const { data } = await api.post('/behaviors/analyze', aiForm);
      setAiResult(data);
      toast.success('Analysis complete!');
    } catch { toast.error('Failed to analyze'); }
    finally { setAiLoading(false); }
  };

  const filtered = items.filter(i =>
    (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>Behavior Patterns</h1>
        <div className="page-header-actions">
          <div className="search-input"><FiSearch /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-ai" onClick={() => setShowAi(true)}><FiCpu /> Analyze Behavior</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><FiPlus /> New Pattern</button>
        </div>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : filtered.length === 0 ? (
        <div className="empty-state"><FiActivity style={{ fontSize: 48 }} /><h3>No behavior patterns</h3><p>Create behavior patterns to model twin behaviors.</p></div>
      ) : (
        <table className="data-table">
          <thead><tr><th>Name</th><th>Category</th><th>Pattern</th><th>Description</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item._id || item.id} onClick={() => setSelected(item)}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                <td>{item.category ? <span className="badge badge-primary">{item.category}</span> : '--'}</td>
                <td>{(item.pattern || '').slice(0, 50)}</td>
                <td>{(item.description || '').slice(0, 80)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <DetailModal isOpen={!!selected && !editing} onClose={() => setSelected(null)} title="Behavior Pattern Details" data={selected} onEdit={handleEdit} onDelete={handleDelete} />

      {showCreate && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-header"><h2>Create Behavior Pattern</h2><button className="modal-close" onClick={() => setShowCreate(false)}>&times;</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label>Name *</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Pattern name" /></div>
                <div className="form-group"><label>Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this pattern..." /></div>
                <div className="form-row">
                  <div className="form-group"><label>Category</label><input className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g., Communication" /></div>
                  <div className="form-group"><label>Twin ID</label><input className="form-control" value={form.twinId} onChange={e => setForm({ ...form, twinId: e.target.value })} placeholder="Twin ID" /></div>
                </div>
                <div className="form-group"><label>Pattern</label><textarea className="form-control" value={form.pattern} onChange={e => setForm({ ...form, pattern: e.target.value })} placeholder="Define the behavior pattern..." /></div>
                <div className="form-group"><label>Triggers (comma-separated)</label><input className="form-control" value={form.triggers} onChange={e => setForm({ ...form, triggers: e.target.value })} placeholder="trigger1, trigger2" /></div>
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
            <div className="modal-header"><h2>Edit Behavior Pattern</h2><button className="modal-close" onClick={() => setEditing(false)}>&times;</button></div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group"><label>Name</label><input className="form-control" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div className="form-group"><label>Description</label><textarea className="form-control" value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Category</label><input className="form-control" value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} /></div>
                  <div className="form-group"><label>Pattern</label><input className="form-control" value={editForm.pattern || ''} onChange={e => setEditForm({ ...editForm, pattern: e.target.value })} /></div>
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
            <div className="modal-header"><h2>Analyze Behavior</h2><button className="modal-close" onClick={() => { setShowAi(false); setAiResult(null); }}>&times;</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Twin ID</label><input className="form-control" value={aiForm.twinId} onChange={e => setAiForm({ ...aiForm, twinId: e.target.value })} placeholder="Twin ID" /></div>
              <div className="form-group"><label>Context</label><input className="form-control" value={aiForm.context} onChange={e => setAiForm({ ...aiForm, context: e.target.value })} placeholder="Behavioral context" /></div>
              <div className="form-group"><label>Behavior Data</label><textarea className="form-control" value={aiForm.behaviorData} onChange={e => setAiForm({ ...aiForm, behaviorData: e.target.value })} placeholder="Paste behavior data to analyze..." style={{ minHeight: 120 }} /></div>
              <button className="btn btn-ai" onClick={handleAiAnalyze} disabled={aiLoading}><FiCpu /> {aiLoading ? 'Analyzing...' : 'Analyze'}</button>
              <AIOutput data={aiResult} loading={aiLoading} title="Behavior Analysis" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
