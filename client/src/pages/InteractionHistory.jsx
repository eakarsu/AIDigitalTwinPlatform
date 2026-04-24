import React, { useEffect, useState } from 'react';
import { FiClock, FiSearch, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import DetailModal from '../components/DetailModal';
import { format } from 'date-fns';

export default function InteractionHistory() {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [twins, setTwins] = useState([]);
  const [twinFilter, setTwinFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, twinRes] = await Promise.allSettled([
          api.get('/conversations'),
          api.get('/twins')
        ]);

        if (twinRes.status === 'fulfilled') {
          const d = twinRes.value.data;
          setTwins(Array.isArray(d) ? d : d.twins || d.data || []);
        }

        if (convRes.status === 'fulfilled') {
          const convos = Array.isArray(convRes.value.data) ? convRes.value.data : convRes.value.data.conversations || convRes.value.data.data || [];
          // Flatten all messages from all conversations into a timeline
          const allInteractions = [];
          for (const convo of convos) {
            const msgs = convo.messages || [];
            for (const msg of msgs) {
              allInteractions.push({
                ...msg,
                _id: msg._id || `${convo._id || convo.id}-${allInteractions.length}`,
                conversationId: convo._id || convo.id,
                conversationTitle: convo.title || 'Untitled',
                twinId: convo.twinId,
                participantName: convo.participantName,
                timestamp: msg.timestamp || msg.createdAt || convo.createdAt,
              });
            }
            // If no messages, still show the conversation
            if (msgs.length === 0) {
              allInteractions.push({
                _id: convo._id || convo.id,
                conversationId: convo._id || convo.id,
                conversationTitle: convo.title || 'Untitled',
                twinId: convo.twinId,
                participantName: convo.participantName,
                content: 'Conversation created',
                role: 'system',
                timestamp: convo.createdAt,
              });
            }
          }
          allInteractions.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          setInteractions(allInteractions);
        }
      } catch { toast.error('Failed to load interaction history'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filtered = interactions.filter(item => {
    const matchSearch = (item.content || item.text || item.message || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.conversationTitle || '').toLowerCase().includes(search.toLowerCase());
    const matchTwin = twinFilter === 'all' || item.twinId === twinFilter;
    let matchDate = true;
    if (dateFrom && item.timestamp) matchDate = new Date(item.timestamp) >= new Date(dateFrom);
    if (dateTo && item.timestamp && matchDate) matchDate = new Date(item.timestamp) <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchTwin && matchDate;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Interaction History</h1>
        <div className="page-header-actions">
          <div className="search-input"><FiSearch /><input placeholder="Search interactions..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
      </div>

      <div className="filter-bar">
        <FiFilter style={{ color: 'var(--text-muted)', fontSize: 14 }} />
        <select className="form-control" style={{ width: 180 }} value={twinFilter} onChange={e => setTwinFilter(e.target.value)}>
          <option value="all">All Twins</option>
          {twins.map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>)}
        </select>
        <input type="date" className="form-control" style={{ width: 160 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
        <input type="date" className="form-control" style={{ width: 160 }} value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
        {(twinFilter !== 'all' || dateFrom || dateTo) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setTwinFilter('all'); setDateFrom(''); setDateTo(''); }}>Clear</button>
        )}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : filtered.length === 0 ? (
        <div className="empty-state"><FiClock style={{ fontSize: 48 }} /><h3>No interactions found</h3><p>Interactions from conversations will appear here.</p></div>
      ) : (
        <div className="timeline">
          {filtered.slice(0, 50).map((item, i) => (
            <div key={item._id || i} className="timeline-item" onClick={() => setSelected(item)} style={{ cursor: 'pointer' }}>
              <div className="timeline-item-content">
                <div className="timeline-item-time">
                  {item.timestamp ? format(new Date(item.timestamp), 'MMM d, yyyy h:mm a') : 'Unknown time'}
                </div>
                <div className="timeline-item-title">
                  <span className={`badge ${item.role === 'user' ? 'badge-primary' : item.role === 'assistant' ? 'badge-accent' : 'badge-secondary'}`} style={{ marginRight: 8 }}>
                    {item.role || 'system'}
                  </span>
                  {item.conversationTitle}
                </div>
                <div className="timeline-item-body">
                  {(item.content || item.text || item.message || '').slice(0, 200)}
                  {(item.content || '').length > 200 ? '...' : ''}
                </div>
                {item.participantName && <div className="text-sm text-muted mt-2">Participant: {item.participantName}</div>}
              </div>
            </div>
          ))}
          {filtered.length > 50 && (
            <div className="text-center text-muted mt-4" style={{ paddingLeft: 20 }}>Showing 50 of {filtered.length} interactions</div>
          )}
        </div>
      )}

      <DetailModal isOpen={!!selected} onClose={() => setSelected(null)} title="Interaction Details" data={selected} />
    </div>
  );
}
