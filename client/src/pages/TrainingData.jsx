import React, { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiBookOpen, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import DetailModal from '../components/DetailModal';
import AIOutput from '../components/AIOutput';

export default function TrainingData() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ input: '', output: '', category: '', twinId: '', quality: 'good' });
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAi, setShowAi] = useState(false);
  const [aiForm, setAiForm] = useState({ topic: '', category: '', twinId: '', count: 1 });

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/training');
      setItems(Array.isArray(data) ? data : data.training || data.data || []);
    } catch { toast.error('Failed to load training data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.input || !form.output) { toast.error('Input and output are required'); return; }
    setSaving(true);
    try {
      await api.post('/training', form);
      toast.success('Training pair created!');
      setShowCreate(false);
      setForm({ input: '', output: '', category: '', twinId: '', quality: 'good' });
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleEdit = () => { setEditForm({ ...selected }); setEditing(true); setSelected(null); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/training/${editForm._id || editForm.id}`, editForm);
      toast.success('Updated!');
      setEditing(false);
      fetchItems();
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/training/${selected._id || selected.id}`);
      toast.success('Deleted!');
      setSelected(null);
      fetchItems();
    } catch { toast.error('Failed to delete'); }
  };

  const handleAiGenerate = async () => {
    if (!aiForm.topic) { toast.error('Topic is required'); return; }
    setAiLoading(true); setAiResult(null);
    try {
      const { data } = await api.post('/training/generate', aiForm);
      setAiResult(data);
      toast.success('Training data generated!');
      fetchItems();
    } catch { toast.error('Failed to generate'); }
    finally { setAiLoading(false); }
  };

  const filtered = items.filter(i =>
    (i.input || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.output || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const qualityColor = (q) => {
    if (!q) return 'badge-secondary';
    switch (q.toLowerCase()) {
      case 'excellent': return 'badge-success';
      case 'good': return 'badge-primary';
      case 'fair': return 'badge-warning';
      case 'poor': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Training Data</h1>
        <div className="page-header-actions">
          <div className="search-input"><FiSearch /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-ai" onClick={() => setShowAi(true)}><FiCpu /> Generate Training Pair</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><FiPlus /> New Pair</button>
        </div>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : filtered.length === 0 ? (
        <div className="empty-state"><FiBookOpen style={{ fontSize: 48 }} /><h3>No training data</h3><p>Create training pairs for your digital twins.</p></div>
      ) : (
        <table className="data-table">
          <thead><tr><th>Input</th><th>Output</th><th>Category</th><th>Quality</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item._id || item.id} onClick={() => setSelected(item)}>
                <td style={{ maxWidth: 250 }}>{(item.input || '').slice(0, 80)}...</td>
                <td style={{ maxWidth: 250 }}>{(item.output || '').slice(0, 80)}...</td>
                <td>{item.category || '--'}</td>
                <td><span className={`badge ${qualityColor(item.quality)}`}>{item.quality || 'N/A'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <DetailModal isOpen={!!selected && !editing} onClose={() => setSelected(null)} title="Training Pair Details" data={selected} onEdit={handleEdit} onDelete={handleDelete} />

      {showCreate && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-header"><h2>Create Training Pair</h2><button className="modal-close" onClick={() => setShowCreate(false)}>&times;</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label>Input *</label><textarea className="form-control" value={form.input} onChange={e => setForm({ ...form, input: e.target.value })} placeholder="Training input/prompt..." /></div>
                <div className="form-group"><label>Output *</label><textarea className="form-control" value={form.output} onChange={e => setForm({ ...form, output: e.target.value })} placeholder="Expected output/response..." /></div>
                <div className="form-row">
                  <div className="form-group"><label>Category</label><input className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Category" /></div>
                  <div className="form-group"><label>Quality</label>
                    <select className="form-control" value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })}>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Twin ID</label><input className="form-control" value={form.twinId} onChange={e => setForm({ ...form, twinId: e.target.value })} placeholder="Associated twin" /></div>
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
            <div className="modal-header"><h2>Edit Training Pair</h2><button className="modal-close" onClick={() => setEditing(false)}>&times;</button></div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group"><label>Input</label><textarea className="form-control" value={editForm.input || ''} onChange={e => setEditForm({ ...editForm, input: e.target.value })} /></div>
                <div className="form-group"><label>Output</label><textarea className="form-control" value={editForm.output || ''} onChange={e => setEditForm({ ...editForm, output: e.target.value })} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Category</label><input className="form-control" value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} /></div>
                  <div className="form-group"><label>Quality</label>
                    <select className="form-control" value={editForm.quality || ''} onChange={e => setEditForm({ ...editForm, quality: e.target.value })}>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
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
            <div className="modal-header"><h2>Generate Training Data</h2><button className="modal-close" onClick={() => { setShowAi(false); setAiResult(null); }}>&times;</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Topic *</label><input className="form-control" value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })} placeholder="Training topic" /></div>
              <div className="form-row">
                <div className="form-group"><label>Category</label><input className="form-control" value={aiForm.category} onChange={e => setAiForm({ ...aiForm, category: e.target.value })} placeholder="Category" /></div>
                <div className="form-group"><label>Twin ID</label><input className="form-control" value={aiForm.twinId} onChange={e => setAiForm({ ...aiForm, twinId: e.target.value })} placeholder="Twin ID" /></div>
              </div>
              <div className="form-group"><label>Number of Pairs</label><input className="form-control" type="number" min="1" max="10" value={aiForm.count} onChange={e => setAiForm({ ...aiForm, count: parseInt(e.target.value) || 1 })} /></div>
              <button className="btn btn-ai" onClick={handleAiGenerate} disabled={aiLoading}><FiCpu /> {aiLoading ? 'Generating...' : 'Generate'}</button>
              <AIOutput data={aiResult} loading={aiLoading} title="Generated Training Data" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
