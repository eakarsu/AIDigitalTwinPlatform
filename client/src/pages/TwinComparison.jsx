import React, { useEffect, useState } from 'react';
import { FiGitBranch, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import AIOutput from '../components/AIOutput';

export default function TwinComparison() {
  const [twins, setTwins] = useState([]);
  const [twin1, setTwin1] = useState('');
  const [twin2, setTwin2] = useState('');
  const [loading, setLoading] = useState(false);
  const [twinsLoading, setTwinsLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchTwins = async () => {
      try {
        const { data } = await api.get('/twins');
        setTwins(Array.isArray(data) ? data : data.twins || data.data || []);
      } catch { toast.error('Failed to load twins'); }
      finally { setTwinsLoading(false); }
    };
    fetchTwins();
  }, []);

  const handleCompare = async () => {
    if (!twin1 || !twin2) { toast.error('Please select two twins to compare'); return; }
    if (twin1 === twin2) { toast.error('Please select two different twins'); return; }
    setLoading(true); setResult(null);
    try {
      const { data } = await api.post('/comparison/compare', { twinId1: twin1, twinId2: twin2 });
      setResult(data);
      toast.success('Comparison complete!');
    } catch { toast.error('Failed to compare twins'); }
    finally { setLoading(false); }
  };

  const twin1Info = twins.find(t => (t._id || t.id) === twin1);
  const twin2Info = twins.find(t => (t._id || t.id) === twin2);

  return (
    <div>
      <div className="page-header">
        <h1>Twin Comparison</h1>
        <span className="badge badge-accent">AI Powered</span>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">Select Twins to Compare</div>
        </div>
        <div className="comparison-selector">
          <select className="form-control" value={twin1} onChange={e => setTwin1(e.target.value)}>
            <option value="">Select first twin...</option>
            {twins.map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>)}
          </select>
          <span className="comparison-vs">VS</span>
          <select className="form-control" value={twin2} onChange={e => setTwin2(e.target.value)}>
            <option value="">Select second twin...</option>
            {twins.map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>)}
          </select>
          <button className="btn btn-ai" onClick={handleCompare} disabled={loading || !twin1 || !twin2}>
            <FiCpu /> {loading ? 'Comparing...' : 'Compare'}
          </button>
        </div>
      </div>

      {/* Side by side info */}
      {(twin1Info || twin2Info) && (
        <div className="comparison-grid mb-4">
          <div className="comparison-panel">
            {twin1Info ? (
              <>
                <h3>{twin1Info.name}</h3>
                <div className="detail-info-item mb-2"><label>Status</label><span className={`badge ${twin1Info.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>{twin1Info.status}</span></div>
                <div className="detail-info-item mb-2"><label>Industry</label><span>{twin1Info.industry || 'General'}</span></div>
                <div className="detail-info-item"><label>Description</label><span style={{ fontSize: 12 }}>{twin1Info.description || 'No description'}</span></div>
              </>
            ) : <div className="empty-state" style={{ padding: 30 }}><p>Select a twin</p></div>}
          </div>
          <div className="comparison-panel">
            {twin2Info ? (
              <>
                <h3>{twin2Info.name}</h3>
                <div className="detail-info-item mb-2"><label>Status</label><span className={`badge ${twin2Info.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>{twin2Info.status}</span></div>
                <div className="detail-info-item mb-2"><label>Industry</label><span>{twin2Info.industry || 'General'}</span></div>
                <div className="detail-info-item"><label>Description</label><span style={{ fontSize: 12 }}>{twin2Info.description || 'No description'}</span></div>
              </>
            ) : <div className="empty-state" style={{ padding: 30 }}><p>Select a twin</p></div>}
          </div>
        </div>
      )}

      <AIOutput data={result} loading={loading} title="AI Comparison Result" />

      {!result && !loading && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <FiGitBranch style={{ fontSize: 48 }} />
          <h3>Compare Digital Twins</h3>
          <p>Select two twins above and click Compare to see an AI-powered analysis of their differences and similarities.</p>
        </div>
      )}
    </div>
  );
}
