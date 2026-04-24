import React, { useEffect, useState } from 'react';
import { FiSettings, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ key: '', value: '', category: 'general', description: '' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, sysRes] = await Promise.allSettled([
          api.get('/settings'),
          api.get('/settings/system-info')
        ]);
        if (settingsRes.status === 'fulfilled') {
          const d = settingsRes.value.data;
          setSettings(Array.isArray(d) ? d : d.settings || d.data || []);
        }
        if (sysRes.status === 'fulfilled') {
          setSystemInfo(sysRes.value.data);
        }
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.key) { toast.error('Key is required'); return; }
    setSaving(true);
    try {
      await api.post('/settings', form);
      toast.success('Setting created!');
      setShowCreate(false);
      setForm({ key: '', value: '', category: 'general', description: '' });
      const { data } = await api.get('/settings');
      setSettings(Array.isArray(data) ? data : data.settings || data.data || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleSaveEdit = async (setting) => {
    try {
      await api.put(`/settings/${setting._id || setting.id}`, { ...setting, value: editValue });
      toast.success('Setting updated!');
      setEditingId(null);
      const { data } = await api.get('/settings');
      setSettings(Array.isArray(data) ? data : data.settings || data.data || []);
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (setting) => {
    if (!window.confirm(`Delete setting "${setting.key}"?`)) return;
    try {
      await api.delete(`/settings/${setting._id || setting.id}`);
      toast.success('Setting deleted!');
      const { data } = await api.get('/settings');
      setSettings(Array.isArray(data) ? data : data.settings || data.data || []);
    } catch { toast.error('Failed to delete'); }
  };

  const maskValue = (key, value) => {
    const lower = (key || '').toLowerCase();
    if (lower.includes('key') || lower.includes('secret') || lower.includes('password') || lower.includes('token')) {
      const str = String(value);
      if (str.length > 8) return str.slice(0, 4) + '****' + str.slice(-4);
      return '****';
    }
    return String(value);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const groupedSettings = {};
  settings.forEach(s => {
    const cat = s.category || 'general';
    if (!groupedSettings[cat]) groupedSettings[cat] = [];
    groupedSettings[cat].push(s);
  });

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Setting</button>
        </div>
      </div>

      {/* System Info */}
      {systemInfo && (
        <div className="settings-section">
          <h2>System Information</h2>
          {Object.entries(systemInfo).map(([key, value]) => (
            <div key={key} className="settings-row">
              <span className="settings-row-label">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, s => s.toUpperCase())}</span>
              <span className="settings-row-value">{typeof value === 'object' ? JSON.stringify(value) : maskValue(key, value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Settings Groups */}
      {Object.keys(groupedSettings).length > 0 ? (
        Object.entries(groupedSettings).map(([category, items]) => (
          <div key={category} className="settings-section">
            <h2>{category.charAt(0).toUpperCase() + category.slice(1)} Settings</h2>
            {items.map(setting => (
              <div key={setting._id || setting.id || setting.key} className="settings-row">
                <div>
                  <span className="settings-row-label" style={{ fontWeight: 600 }}>{setting.key}</span>
                  {setting.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{setting.description}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {editingId === (setting._id || setting.id) ? (
                    <>
                      <input className="form-control" style={{ width: 200 }} value={editValue} onChange={e => setEditValue(e.target.value)} />
                      <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(setting)}><FiSave /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className="settings-row-value">{maskValue(setting.key, setting.value)}</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(setting._id || setting.id); setEditValue(String(setting.value || '')); }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(setting)}>Del</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="settings-section">
          <h2>Configuration</h2>
          <div className="empty-state" style={{ padding: 30 }}>
            <FiSettings style={{ fontSize: 36 }} />
            <h3>No settings configured</h3>
            <p>Add settings to configure your platform.</p>
          </div>
        </div>
      )}

      {/* API Configuration Display */}
      <div className="settings-section">
        <h2>API Configuration</h2>
        <div className="settings-row">
          <span className="settings-row-label">API Base URL</span>
          <span className="settings-row-value">/api</span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Backend Server</span>
          <span className="settings-row-value">http://localhost:3001</span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Auth Token</span>
          <span className="settings-row-value">{localStorage.getItem('token') ? maskValue('token', localStorage.getItem('token')) : 'Not authenticated'}</span>
        </div>
      </div>

      {/* Create Setting Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-header"><h2>Create Setting</h2><button className="modal-close" onClick={() => setShowCreate(false)}>&times;</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label>Key *</label><input className="form-control" value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} placeholder="setting_key" /></div>
                <div className="form-group"><label>Value</label><input className="form-control" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="Setting value" /></div>
                <div className="form-group"><label>Category</label>
                  <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="general">General</option>
                    <option value="api">API</option>
                    <option value="ai">AI</option>
                    <option value="security">Security</option>
                    <option value="notifications">Notifications</option>
                  </select>
                </div>
                <div className="form-group"><label>Description</label><input className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What this setting does" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
