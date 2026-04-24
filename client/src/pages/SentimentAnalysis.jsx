import React, { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiSmile, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import DetailModal from '../components/DetailModal';
import AIOutput from '../components/AIOutput';

export default function SentimentAnalysis() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [analyzeText, setAnalyzeText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ text: '', sentiment: '', score: '', source: '' });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/sentiments');
      setItems(Array.isArray(data) ? data : data.sentiments || data.data || []);
    } catch { toast.error('Failed to load sentiments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAnalyze = async () => {
    if (!analyzeText.trim()) { toast.error('Please enter text to analyze'); return; }
    setAiLoading(true); setAiResult(null);
    try {
      const { data } = await api.post('/sentiments/analyze', { text: analyzeText });
      setAiResult(data);
      toast.success('Analysis complete!');
      fetchItems();
    } catch { toast.error('Failed to analyze sentiment'); }
    finally { setAiLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.text) { toast.error('Text is required'); return; }
    setSaving(true);
    try {
      await api.post('/sentiments', form);
      toast.success('Sentiment entry created!');
      setShowCreate(false);
      setForm({ text: '', sentiment: '', score: '', source: '' });
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleEdit = () => { setEditForm({ ...selected }); setEditing(true); setSelected(null); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/sentiments/${editForm._id || editForm.id}`, editForm);
      toast.success('Updated!');
      setEditing(false);
      fetchItems();
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/sentiments/${selected._id || selected.id}`);
      toast.success('Deleted!');
      setSelected(null);
      fetchItems();
    } catch { toast.error('Failed to delete'); }
  };

  const sentimentColor = (s) => {
    if (!s) return 'badge-secondary';
    const lower = s.toLowerCase();
    if (lower === 'positive') return 'badge-success';
    if (lower === 'negative') return 'badge-danger';
    if (lower === 'mixed') return 'badge-warning';
    return 'badge-secondary';
  };

  const filtered = items.filter(i =>
    (i.text || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.sentiment || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>Sentiment Analysis</h1>
        <div className="page-header-actions">
          <div className="search-input"><FiSearch /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><FiPlus /> New Entry</button>
        </div>
      </div>

      {/* Analyze Section */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">Analyze New Text</div>
          <span className="badge badge-accent">AI Powered</span>
        </div>
        <div className="card-body">
          <textarea
            className="form-control"
            value={analyzeText}
            onChange={e => setAnalyzeText(e.target.value)}
            placeholder="Enter text to analyze sentiment..."
            style={{ minHeight: 120, marginBottom: 14 }}
          />
          <button className="btn btn-ai" onClick={handleAnalyze} disabled={aiLoading}>
            <FiCpu /> {aiLoading ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>
        </div>
        <AIOutput data={aiResult} loading={aiLoading} title="Sentiment Analysis Result" />
      </div>

      {/* Past Analyses */}
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Past Analyses</h2>
      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : filtered.length === 0 ? (
        <div className="empty-state"><FiSmile style={{ fontSize: 48 }} /><h3>No sentiment analyses</h3><p>Analyze some text to get started.</p></div>
      ) : (
        <table className="data-table">
          <thead><tr><th>Text</th><th>Sentiment</th><th>Score</th><th>Source</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item._id || item.id} onClick={() => setSelected(item)}>
                <td>{(item.text || '').slice(0, 80)}{(item.text || '').length > 80 ? '...' : ''}</td>
                <td><span className={`badge ${sentimentColor(item.sentiment)}`}>{item.sentiment || '--'}</span></td>
                <td>{item.score != null ? (typeof item.score === 'number' ? (item.score * 100).toFixed(0) + '%' : item.score) : '--'}</td>
                <td>{item.source || '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <DetailModal isOpen={!!selected && !editing} onClose={() => setSelected(null)} title="Sentiment Details" data={selected} onEdit={handleEdit} onDelete={handleDelete} />

      {showCreate && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-header"><h2>Create Sentiment Entry</h2><button className="modal-close" onClick={() => setShowCreate(false)}>&times;</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label>Text *</label><textarea className="form-control" value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="Text content" /></div>
                <div className="form-row">
                  <div className="form-group"><label>Sentiment</label>
                    <select className="form-control" value={form.sentiment} onChange={e => setForm({ ...form, sentiment: e.target.value })}>
                      <option value="">Select...</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                      <option value="neutral">Neutral</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Score (0-1)</label><input className="form-control" type="number" step="0.01" min="0" max="1" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Source</label><input className="form-control" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Data source" /></div>
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
            <div className="modal-header"><h2>Edit Sentiment Entry</h2><button className="modal-close" onClick={() => setEditing(false)}>&times;</button></div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group"><label>Text</label><textarea className="form-control" value={editForm.text || ''} onChange={e => setEditForm({ ...editForm, text: e.target.value })} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Sentiment</label>
                    <select className="form-control" value={editForm.sentiment || ''} onChange={e => setEditForm({ ...editForm, sentiment: e.target.value })}>
                      <option value="">Select...</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                      <option value="neutral">Neutral</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Score</label><input className="form-control" type="number" step="0.01" min="0" max="1" value={editForm.score || ''} onChange={e => setEditForm({ ...editForm, score: e.target.value })} /></div>
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
    </div>
  );
}
