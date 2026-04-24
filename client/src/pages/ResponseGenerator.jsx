import React, { useEffect, useState } from 'react';
import { FiZap, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import AIOutput from '../components/AIOutput';

export default function ResponseGenerator() {
  const [twins, setTwins] = useState([]);
  const [selectedTwin, setSelectedTwin] = useState('');
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [twinsLoading, setTwinsLoading] = useState(true);

  useEffect(() => {
    const fetchTwins = async () => {
      try {
        const { data } = await api.get('/twins');
        setTwins(Array.isArray(data) ? data : data.twins || data.data || []);
      } catch {}
      finally { setTwinsLoading(false); }
    };
    fetchTwins();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) { toast.error('Enter a message'); return; }
    if (!selectedTwin) { toast.error('Select a twin first'); return; }

    const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setConversation(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      // Try to create a conversation and send message
      let convoId;
      try {
        const createRes = await api.post('/conversations', { title: `Response Gen - ${Date.now()}`, twinId: selectedTwin });
        const convo = createRes.data.conversation || createRes.data;
        convoId = convo._id || convo.id;
      } catch {
        // If creating conversation fails, try direct endpoint
        convoId = 'temp';
      }

      let replyText;
      if (convoId !== 'temp') {
        const { data } = await api.post(`/conversations/${convoId}/messages`, { message: message, content: message });
        const reply = data.reply || data.message || data.response || data;
        replyText = typeof reply === 'string' ? reply : reply.content || reply.text || JSON.stringify(reply);
      } else {
        replyText = 'The response generator requires a valid conversation. Please check your twin selection and try again.';
      }

      setConversation(prev => [...prev, {
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      toast.error('Failed to generate response');
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error generating a response.',
        timestamp: new Date().toISOString()
      }]);
    } finally { setLoading(false); }
  };

  const selectedTwinInfo = twins.find(t => (t._id || t.id) === selectedTwin);

  return (
    <div>
      <div className="page-header">
        <h1>Response Generator</h1>
        <span className="badge badge-accent">AI Powered</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, height: 'calc(100vh - 160px)' }}>
        {/* Twin Selection Panel */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Select a Twin</h3>
            <select className="form-control" value={selectedTwin} onChange={e => setSelectedTwin(e.target.value)}>
              <option value="">Choose a twin...</option>
              {twins.map(t => (
                <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          {selectedTwinInfo && (
            <div style={{ padding: 16 }}>
              <div className="detail-info-item" style={{ marginBottom: 8 }}>
                <label>Name</label>
                <span>{selectedTwinInfo.name}</span>
              </div>
              <div className="detail-info-item" style={{ marginBottom: 8 }}>
                <label>Status</label>
                <span className={`badge ${selectedTwinInfo.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>{selectedTwinInfo.status}</span>
              </div>
              <div className="detail-info-item">
                <label>Industry</label>
                <span>{selectedTwinInfo.industry || 'General'}</span>
              </div>
              {selectedTwinInfo.description && (
                <div className="detail-info-item" style={{ marginTop: 8 }}>
                  <label>Description</label>
                  <span style={{ fontSize: 12 }}>{selectedTwinInfo.description}</span>
                </div>
              )}
            </div>
          )}
          {twinsLoading && <div className="loading-spinner"><div className="spinner" /></div>}
        </div>

        {/* Chat Area */}
        <div className="chat-container">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiZap style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedTwinInfo ? `Chat with ${selectedTwinInfo.name}` : 'Response Generator'}
            </h3>
          </div>
          <div className="chat-messages">
            {conversation.length === 0 ? (
              <div className="empty-state">
                <FiZap style={{ fontSize: 48 }} />
                <h3>Generate AI Responses</h3>
                <p>Select a twin and type a message to generate AI-powered responses.</p>
              </div>
            ) : (
              conversation.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.role}`}>
                  {msg.content}
                  <span className="msg-time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
            {loading && (
              <div className="chat-message assistant">
                <div className="ai-typing" style={{ padding: 0 }}>
                  <div className="ai-typing-dot" /><div className="ai-typing-dot" /><div className="ai-typing-dot" />
                </div>
              </div>
            )}
          </div>
          <div className="chat-input-area">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={selectedTwin ? "Type your message..." : "Select a twin first..."}
              disabled={loading || !selectedTwin}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button className="btn btn-primary" onClick={handleSend} disabled={loading || !message.trim() || !selectedTwin}>
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
