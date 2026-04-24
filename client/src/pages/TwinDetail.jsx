import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiCpu, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import AIOutput from '../components/AIOutput';

export default function TwinDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchTwin = async () => {
    try {
      const { data } = await api.get(`/twins/${id}`);
      const t = data.twin || data;
      setTwin(t);
      setEditForm({ name: t.name || '', description: t.description || '', industry: t.industry || '', status: t.status || 'active', language: t.language || 'en' });
    } catch (err) {
      toast.error('Failed to load twin');
      navigate('/twins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTwin(); }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/twins/${id}`, editForm);
      toast.success('Twin updated!');
      setEditing(false);
      fetchTwin();
    } catch (err) {
      toast.error('Failed to update twin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/twins/${id}`);
      toast.success('Twin deleted');
      navigate('/twins');
    } catch (err) {
      toast.error('Failed to delete twin');
    }
  };

  const handleGeneratePersonality = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data } = await api.post(`/twins/${id}/generate-personality`);
      setAiResult(data);
      toast.success('Personality generated!');
    } catch (err) {
      toast.error('Failed to generate personality');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!twin) return null;

  const tabs = ['overview', 'personality', 'conversations', 'knowledge', 'behaviors', 'memories'];

  return (
    <div>
      <button className="btn btn-ghost mb-4" onClick={() => navigate('/twins')}><FiArrowLeft /> Back to Twins</button>

      <div className="detail-hero">
        <div className="detail-hero-header">
          <div>
            <h1>{twin.name}</h1>
            <div className="detail-hero-meta">
              <span>
                <span className={`status-dot ${twin.status === 'active' ? 'status-active' : twin.status === 'training' ? 'status-training' : 'status-inactive'}`} />
                {twin.status || 'active'}
              </span>
              <span>{twin.industry || 'General'}</span>
              <span>Language: {twin.language || 'en'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ai" onClick={handleGeneratePersonality} disabled={aiLoading}>
              <FiCpu /> {aiLoading ? 'Generating...' : 'Generate Personality'}
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing(true)}><FiEdit2 /> Edit</button>
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}><FiTrash2 /> Delete</button>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{twin.description || 'No description.'}</p>
        <div className="detail-info-grid">
          {twin.createdAt && <div className="detail-info-item"><label>Created</label><span>{new Date(twin.createdAt).toLocaleDateString()}</span></div>}
          {twin.updatedAt && <div className="detail-info-item"><label>Updated</label><span>{new Date(twin.updatedAt).toLocaleDateString()}</span></div>}
          {twin.model && <div className="detail-info-item"><label>Model</label><span>{twin.model}</span></div>}
          {twin.version && <div className="detail-info-item"><label>Version</label><span>{twin.version}</span></div>}
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>About</h3>
            <p>{twin.description || 'No description available.'}</p>
            {twin.capabilities && (
              <div className="mt-4">
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Capabilities</h4>
                <div className="tags-container">
                  {(Array.isArray(twin.capabilities) ? twin.capabilities : []).map((c, i) => <span key={i} className="tag">{c}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab !== 'overview' && (
        <div className="card">
          <div className="card-body">
            <p className="text-muted">View {activeTab} data for this twin in the dedicated {activeTab} section.</p>
          </div>
        </div>
      )}

      <AIOutput data={aiResult} loading={aiLoading} title="Generated Personality Profile" />

      {/* Edit Modal */}
      {editing && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setEditing(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Twin</h2>
              <button className="modal-close" onClick={() => setEditing(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input className="form-control" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Industry</label>
                    <input className="form-control" value={editForm.industry} onChange={e => setEditForm({ ...editForm, industry: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="training">Training</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(false); }}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-body">
              <div className="confirm-dialog">
                <h3>Delete Twin</h3>
                <p>Are you sure you want to delete "{twin.name}"? This action cannot be undone.</p>
                <div className="confirm-dialog-actions">
                  <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
                  <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
