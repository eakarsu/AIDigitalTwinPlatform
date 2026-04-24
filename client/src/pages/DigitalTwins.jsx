import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';

export default function DigitalTwins() {
  const [twins, setTwins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', industry: '', status: 'active', language: 'en' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchTwins = async () => {
    try {
      const { data } = await api.get('/twins');
      setTwins(Array.isArray(data) ? data : data.twins || data.data || []);
    } catch (err) {
      toast.error('Failed to load twins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTwins(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await api.post('/twins', form);
      toast.success('Twin created!');
      setShowCreate(false);
      setForm({ name: '', description: '', industry: '', status: 'active', language: 'en' });
      fetchTwins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create twin');
    } finally {
      setSaving(false);
    }
  };

  const filtered = twins.filter(t =>
    (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.industry || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>Digital Twins</h1>
        <div className="page-header-actions">
          <div className="search-input">
            <FiSearch />
            <input placeholder="Search twins..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><FiPlus /> New Twin</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FiUsers />
          <h3>No twins found</h3>
          <p>Create your first digital twin to get started.</p>
        </div>
      ) : (
        <div className="items-grid">
          {filtered.map(twin => (
            <div key={twin._id || twin.id} className="card card-clickable" onClick={() => navigate(`/twins/${twin._id || twin.id}`)}>
              <div className="card-header">
                <div>
                  <div className="card-title">{twin.name}</div>
                  <div className="card-subtitle">{twin.industry || 'General'}</div>
                </div>
                <span className={`badge ${twin.status === 'active' ? 'badge-success' : twin.status === 'training' ? 'badge-warning' : 'badge-secondary'}`}>
                  <span className={`status-dot ${twin.status === 'active' ? 'status-active' : twin.status === 'training' ? 'status-training' : 'status-inactive'}`} />
                  {twin.status || 'active'}
                </span>
              </div>
              <div className="card-body">
                <p>{twin.description || 'No description provided.'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Twin</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Twin name" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this twin..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Industry</label>
                    <input className="form-control" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="e.g., Technology" />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="training">Training</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Language</label>
                  <input className="form-control" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} placeholder="en" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Twin'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
