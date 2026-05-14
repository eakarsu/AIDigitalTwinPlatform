import React, { useEffect, useState } from 'react';
import { FiZap, FiDownload, FiBox, FiUsers, FiHeart, FiHelpCircle, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import AIOutput from '../components/AIOutput';

export default function AITools() {
  const [twins, setTwins] = useState([]);
  const [loadingTwins, setLoadingTwins] = useState(true);

  // Memory extract
  const [memTwin, setMemTwin] = useState('');
  const [conversations, setConversations] = useState([]);
  const [convoId, setConvoId] = useState('');
  const [memLoading, setMemLoading] = useState(false);
  const [memResult, setMemResult] = useState(null);

  // Training export
  const [exportTwin, setExportTwin] = useState('');
  const [exporting, setExporting] = useState(false);

  // Multi-twin
  const [multiSel, setMultiSel] = useState([]);
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiResult, setMultiResult] = useState(null);

  // Predict sentiment
  const [psTwin, setPsTwin] = useState('');
  const [psMessage, setPsMessage] = useState('');
  const [psLoading, setPsLoading] = useState(false);
  const [psResult, setPsResult] = useState(null);

  // Counterfactual
  const [cfTwin, setCfTwin] = useState('');
  const [cfScenario, setCfScenario] = useState('');
  const [cfBaseline, setCfBaseline] = useState('');
  const [cfLoading, setCfLoading] = useState(false);
  const [cfResult, setCfResult] = useState(null);

  // Personality snapshot
  const [snapTwin, setSnapTwin] = useState('');
  const [snapLoading, setSnapLoading] = useState(false);
  const [snapResult, setSnapResult] = useState(null);

  const handleAIError = (e, fallback) => {
    if (e?.response?.status === 503) {
      toast.error('AI service not configured. OPENROUTER_API_KEY missing.');
    } else {
      toast.error(e?.response?.data?.error || fallback);
    }
  };

  useEffect(() => {
    api.get('/twins')
      .then(({ data }) => setTwins(Array.isArray(data) ? data : (data.twins || data.data || [])))
      .catch(() => toast.error('Failed to load twins'))
      .finally(() => setLoadingTwins(false));
  }, []);

  useEffect(() => {
    if (!memTwin) { setConversations([]); setConvoId(''); return; }
    api.get(`/conversations?twinId=${memTwin}&limit=50`)
      .then(({ data }) => setConversations(data.conversations || []))
      .catch(() => toast.error('Failed to load conversations'));
  }, [memTwin]);

  const runMemoryExtract = async () => {
    if (!memTwin || !convoId) { toast.error('Select twin and conversation'); return; }
    setMemLoading(true); setMemResult(null);
    try {
      const { data } = await api.post(`/twins/${memTwin}/memory-extract`, { conversation_id: parseInt(convoId) });
      setMemResult(data);
      toast.success(`Extracted ${data.memories?.length || 0} memories`);
    } catch (e) {
      handleAIError(e, 'Failed to extract');
    } finally {
      setMemLoading(false);
    }
  };

  const runTrainingExport = async () => {
    if (!exportTwin) { toast.error('Select a twin'); return; }
    setExporting(true);
    try {
      const res = await api.post(`/twins/${exportTwin}/training-export`, {}, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/jsonl' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const twin = twins.find(t => (t.id || t._id) == exportTwin);
      a.download = `training-${twin?.name?.replace(/\s+/g, '_') || 'twin'}-${Date.now()}.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Training data exported');
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const toggleMulti = (id) => {
    setMultiSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const runMultiTwin = async () => {
    if (multiSel.length < 2) { toast.error('Select at least 2 twins'); return; }
    setMultiLoading(true); setMultiResult(null);
    try {
      const { data } = await api.post('/comparison/multi-twin', { twin_ids: multiSel });
      setMultiResult(data);
      toast.success('Multi-twin analysis complete');
    } catch (e) {
      handleAIError(e, 'Failed');
    } finally {
      setMultiLoading(false);
    }
  };

  const runPredictSentiment = async () => {
    if (!psTwin || !psMessage.trim()) { toast.error('Select a twin and enter a message'); return; }
    setPsLoading(true); setPsResult(null);
    try {
      const { data } = await api.post(`/twins/${psTwin}/predict-sentiment`, { message: psMessage });
      setPsResult(data);
      toast.success('Sentiment prediction complete');
    } catch (e) {
      handleAIError(e, 'Failed to predict sentiment');
    } finally {
      setPsLoading(false);
    }
  };

  const runCounterfactual = async () => {
    if (!cfTwin || !cfScenario.trim()) { toast.error('Select a twin and enter a scenario'); return; }
    setCfLoading(true); setCfResult(null);
    try {
      const payload = { scenario: cfScenario };
      if (cfBaseline.trim()) payload.baselineContext = cfBaseline;
      const { data } = await api.post(`/twins/${cfTwin}/counterfactual`, payload);
      setCfResult(data);
      toast.success('Counterfactual simulation complete');
    } catch (e) {
      handleAIError(e, 'Failed to simulate');
    } finally {
      setCfLoading(false);
    }
  };

  const runPersonalitySnapshot = async () => {
    if (!snapTwin) { toast.error('Select a twin'); return; }
    setSnapLoading(true); setSnapResult(null);
    try {
      const { data } = await api.post(`/twins/${snapTwin}/personality-snapshot`, {});
      setSnapResult(data);
      toast.success('Personality snapshot complete');
    } catch (e) {
      handleAIError(e, 'Failed to generate snapshot');
    } finally {
      setSnapLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>AI Tools</h1>
        <span className="badge badge-accent">Memory Extract / Training Export / Multi-Twin</span>
      </div>

      {/* Memory Extract */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title"><FiBox /> Memory Auto-Extraction</div>
        </div>
        <p className="text-muted text-sm mb-3">Pull last 10 messages from a conversation, extract key facts, create Memory entries with AI-assessed importance.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label className="form-label">Twin</label>
            <select className="form-control" value={memTwin} onChange={e => setMemTwin(e.target.value)} disabled={loadingTwins}>
              <option value="">Select twin...</option>
              {twins.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Conversation</label>
            <select className="form-control" value={convoId} onChange={e => setConvoId(e.target.value)} disabled={!memTwin}>
              <option value="">Select conversation...</option>
              {conversations.map(c => <option key={c.id} value={c.id}>{c.title} ({c.messageCount || 0} msgs)</option>)}
            </select>
          </div>
          <button className="btn btn-ai" onClick={runMemoryExtract} disabled={memLoading || !memTwin || !convoId}>
            <FiZap /> {memLoading ? 'Extracting...' : 'Extract'}
          </button>
        </div>
        {(memLoading || memResult) && (
          <div style={{ marginTop: 16 }}>
            <AIOutput data={memResult} loading={memLoading} title="Memory Extraction" />
          </div>
        )}
      </div>

      {/* Training export */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title"><FiDownload /> Training Data Export (JSONL)</div>
        </div>
        <p className="text-muted text-sm mb-3">Download all training data pairs for a twin in JSONL format suitable for fine-tuning.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label className="form-label">Twin</label>
            <select className="form-control" value={exportTwin} onChange={e => setExportTwin(e.target.value)} disabled={loadingTwins}>
              <option value="">Select twin...</option>
              {twins.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
            </select>
          </div>
          <button className="btn btn-ai" onClick={runTrainingExport} disabled={exporting || !exportTwin}>
            <FiDownload /> {exporting ? 'Exporting...' : 'Download JSONL'}
          </button>
        </div>
      </div>

      {/* Multi-twin collaboration */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title"><FiUsers /> Multi-Twin Collaboration Analysis</div>
        </div>
        <p className="text-muted text-sm mb-3">Select 2+ twins to analyze group dynamics, role assignments, and collaboration synergy.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {twins.map(t => {
            const id = t.id || t._id;
            const active = multiSel.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleMulti(id)}
                className={`badge ${active ? 'badge-success' : 'badge-secondary'}`}
                style={{ cursor: 'pointer', padding: '6px 12px' }}
              >
                {active ? '✓ ' : ''}{t.name}
              </button>
            );
          })}
        </div>
        <button className="btn btn-ai" onClick={runMultiTwin} disabled={multiLoading || multiSel.length < 2}>
          <FiUsers /> {multiLoading ? 'Analyzing...' : `Analyze ${multiSel.length} Twins`}
        </button>
        {(multiLoading || multiResult) && (
          <div style={{ marginTop: 16 }}>
            <AIOutput data={multiResult?.analysis} loading={multiLoading} title="Multi-Twin Collaboration" />
          </div>
        )}
      </div>

      {/* Predict Sentiment */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title"><FiHeart /> Predict Sentiment</div>
        </div>
        <p className="text-muted text-sm mb-3">Given a hypothetical user message, predict how the twin would feel about it (sentiment, emotions, expected reply tone).</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div>
            <label className="form-label">Twin</label>
            <select className="form-control" value={psTwin} onChange={e => setPsTwin(e.target.value)} disabled={loadingTwins}>
              <option value="">Select twin...</option>
              {twins.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Hypothetical Message</label>
            <textarea
              className="form-control"
              rows={3}
              value={psMessage}
              onChange={e => setPsMessage(e.target.value)}
              placeholder="e.g., I think we should cancel the project entirely."
            />
          </div>
          <button className="btn btn-ai" onClick={runPredictSentiment} disabled={psLoading || !psTwin || !psMessage.trim()}>
            <FiZap /> {psLoading ? 'Predicting...' : 'Predict Sentiment'}
          </button>
        </div>
        {(psLoading || psResult) && (
          <div style={{ marginTop: 16 }}>
            <AIOutput data={psResult?.prediction} loading={psLoading} title="Predicted Sentiment" />
          </div>
        )}
      </div>

      {/* Counterfactual */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title"><FiHelpCircle /> Counterfactual Simulation</div>
        </div>
        <p className="text-muted text-sm mb-3">Simulate the twin's response to a "what if" scenario, including decision path and alternate outcomes.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div>
            <label className="form-label">Twin</label>
            <select className="form-control" value={cfTwin} onChange={e => setCfTwin(e.target.value)} disabled={loadingTwins}>
              <option value="">Select twin...</option>
              {twins.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Scenario (what if...)</label>
            <textarea
              className="form-control"
              rows={3}
              value={cfScenario}
              onChange={e => setCfScenario(e.target.value)}
              placeholder="e.g., What if the team's deadline was unexpectedly cut in half?"
            />
          </div>
          <div>
            <label className="form-label">Baseline Context (optional)</label>
            <textarea
              className="form-control"
              rows={2}
              value={cfBaseline}
              onChange={e => setCfBaseline(e.target.value)}
              placeholder="Any prior context the twin should assume..."
            />
          </div>
          <button className="btn btn-ai" onClick={runCounterfactual} disabled={cfLoading || !cfTwin || !cfScenario.trim()}>
            <FiZap /> {cfLoading ? 'Simulating...' : 'Simulate'}
          </button>
        </div>
        {(cfLoading || cfResult) && (
          <div style={{ marginTop: 16 }}>
            <AIOutput data={cfResult?.simulation} loading={cfLoading} title="Counterfactual Simulation" />
          </div>
        )}
      </div>

      {/* Personality snapshot */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title"><FiUser /> Personality Snapshot</div>
        </div>
        <p className="text-muted text-sm mb-3">Analytical snapshot of the twin's current personality vector — dominant traits, blind spots, and interaction tips.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label className="form-label">Twin</label>
            <select className="form-control" value={snapTwin} onChange={e => setSnapTwin(e.target.value)} disabled={loadingTwins}>
              <option value="">Select twin...</option>
              {twins.map(t => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
            </select>
          </div>
          <button className="btn btn-ai" onClick={runPersonalitySnapshot} disabled={snapLoading || !snapTwin}>
            <FiUser /> {snapLoading ? 'Analyzing...' : 'Generate Snapshot'}
          </button>
        </div>
        {(snapLoading || snapResult) && (
          <div style={{ marginTop: 16 }}>
            <AIOutput data={snapResult?.snapshot} loading={snapLoading} title="Personality Snapshot" />
          </div>
        )}
      </div>
    </div>
  );
}
