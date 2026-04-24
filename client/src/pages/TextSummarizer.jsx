import React, { useState } from 'react';
import { FiFileText, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import AIOutput from '../components/AIOutput';

export default function TextSummarizer() {
  const [text, setText] = useState('');
  const [length, setLength] = useState('medium');
  const [style, setStyle] = useState('paragraph');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSummarize = async () => {
    if (!text.trim()) { toast.error('Please enter text to summarize'); return; }
    setLoading(true); setResult(null);
    try {
      const { data } = await api.post('/summarizer/summarize', { text, length, style });
      setResult(data);
      toast.success('Summary generated!');
    } catch { toast.error('Failed to summarize text'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Text Summarizer</h1>
        <span className="badge badge-accent">AI Powered</span>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">Input Text</div>
          <span className="text-sm text-muted">{text.length} characters</span>
        </div>
        <div className="card-body">
          <textarea
            className="form-control"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste or type the text you want to summarize..."
            style={{ minHeight: 200, marginBottom: 20 }}
          />

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                Summary Length
              </label>
              <div className="option-group">
                {['short', 'medium', 'long'].map(opt => (
                  <button key={opt} className={`option-btn ${length === opt ? 'active' : ''}`} onClick={() => setLength(opt)}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                Output Style
              </label>
              <div className="option-group">
                {['bullet', 'paragraph', 'executive'].map(opt => (
                  <button key={opt} className={`option-btn ${style === opt ? 'active' : ''}`} onClick={() => setStyle(opt)}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="btn btn-ai btn-lg" onClick={handleSummarize} disabled={loading || !text.trim()}>
            <FiCpu /> {loading ? 'Summarizing...' : 'Summarize Text'}
          </button>
        </div>
      </div>

      <AIOutput data={result} loading={loading} title="AI Summary" />

      {!result && !loading && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <FiFileText style={{ fontSize: 48 }} />
          <h3>AI-Powered Summarization</h3>
          <p>Enter text above and choose your preferences to generate a concise summary.</p>
        </div>
      )}
    </div>
  );
}
