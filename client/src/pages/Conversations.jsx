import React, { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiMessageSquare, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import { format } from 'date-fns';

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', twinId: '', participantName: '' });
  const [saving, setSaving] = useState(false);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/conversations');
      setConversations(Array.isArray(data) ? data : data.conversations || data.data || []);
    } catch { toast.error('Failed to load conversations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConversations(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/conversations', form);
      toast.success('Conversation created!');
      setShowCreate(false);
      setForm({ title: '', twinId: '', participantName: '' });
      fetchConversations();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const openConversation = async (convo) => {
    setActiveConvo(convo);
    setMessages(convo.messages || []);
    // Try to fetch full conversation
    try {
      const { data } = await api.get(`/conversations/${convo._id || convo.id}`);
      const full = data.conversation || data;
      setMessages(full.messages || []);
    } catch {}
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeConvo) return;
    const convoId = activeConvo._id || activeConvo.id;
    const userMsg = { role: 'user', content: msgInput, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setMsgInput('');
    setSending(true);
    try {
      const { data } = await api.post(`/conversations/${convoId}/messages`, { message: msgInput, content: msgInput });
      const reply = data.reply || data.message || data.response || data;
      const assistantMsg = {
        role: 'assistant',
        content: typeof reply === 'string' ? reply : reply.content || reply.text || JSON.stringify(reply),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      toast.error('Failed to send message');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that request.', timestamp: new Date().toISOString() }]);
    } finally { setSending(false); }
  };

  const handleDelete = async (convo) => {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/conversations/${convo._id || convo.id}`);
      toast.success('Deleted!');
      if (activeConvo && (activeConvo._id || activeConvo.id) === (convo._id || convo.id)) {
        setActiveConvo(null);
        setMessages([]);
      }
      fetchConversations();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = conversations.filter(c =>
    (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.participantName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>Conversations</h1>
        <div className="page-header-actions">
          <div className="search-input"><FiSearch /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><FiPlus /> New Conversation</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, height: 'calc(100vh - 160px)' }}>
        {/* Conversation List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>All Conversations ({filtered.length})</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <div className="loading-spinner"><div className="spinner" /></div> : filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}><p>No conversations yet</p></div>
            ) : (
              filtered.map(convo => (
                <div
                  key={convo._id || convo.id}
                  className={`convo-item ${activeConvo && (activeConvo._id || activeConvo.id) === (convo._id || convo.id) ? 'active' : ''}`}
                  onClick={() => openConversation(convo)}
                >
                  <div className="convo-avatar"><FiMessageSquare /></div>
                  <div className="convo-info">
                    <h4>{convo.title || 'Untitled'}</h4>
                    <p>{convo.participantName || convo.twinId || 'No participant'}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className="convo-time">{convo.createdAt ? format(new Date(convo.createdAt), 'MMM d') : ''}</span>
                    <button className="btn btn-danger btn-sm" style={{ padding: '2px 6px', fontSize: 10 }} onClick={(e) => { e.stopPropagation(); handleDelete(convo); }}>Del</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeConvo ? (
          <div className="chat-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{activeConvo.title}</h3>
                <span className="text-sm text-muted">{activeConvo.participantName || 'AI Twin'}</span>
              </div>
              <span className="badge badge-success">Active</span>
            </div>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="empty-state"><p>No messages yet. Start the conversation!</p></div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role || msg.sender || 'user'}`}>
                    {msg.content || msg.text || msg.message}
                    <span className="msg-time">{msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : ''}</span>
                  </div>
                ))
              )}
              {sending && (
                <div className="chat-message assistant">
                  <div className="ai-typing" style={{ padding: 0 }}>
                    <div className="ai-typing-dot" /><div className="ai-typing-dot" /><div className="ai-typing-dot" />
                  </div>
                </div>
              )}
            </div>
            <form className="chat-input-area" onSubmit={sendMessage}>
              <input value={msgInput} onChange={e => setMsgInput(e.target.value)} placeholder="Type a message..." disabled={sending} />
              <button className="btn btn-primary" type="submit" disabled={sending || !msgInput.trim()}><FiSend /></button>
            </form>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="empty-state">
              <FiMessageSquare style={{ fontSize: 48 }} />
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list or create a new one.</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-header"><h2>New Conversation</h2><button className="modal-close" onClick={() => setShowCreate(false)}>&times;</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group"><label>Title *</label><input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Conversation title" /></div>
                <div className="form-group"><label>Twin ID</label><input className="form-control" value={form.twinId} onChange={e => setForm({ ...form, twinId: e.target.value })} placeholder="Associated twin ID" /></div>
                <div className="form-group"><label>Participant Name</label><input className="form-control" value={form.participantName} onChange={e => setForm({ ...form, participantName: e.target.value })} placeholder="Name of participant" /></div>
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
