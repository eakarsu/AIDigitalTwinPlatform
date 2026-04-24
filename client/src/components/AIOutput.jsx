import React, { useState } from 'react';
import { FiCpu, FiChevronDown, FiChevronRight } from 'react-icons/fi';

function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="collapsible">
      <button className="collapsible-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        {open ? <FiChevronDown /> : <FiChevronRight />}
      </button>
      {open && <div className="collapsible-content">{children}</div>}
    </div>
  );
}

function renderScore(value, label) {
  if (typeof value !== 'number') return null;
  const percentage = Math.round(value * (value <= 1 ? 100 : 1));
  const className = percentage >= 60 ? 'ai-score-positive' : percentage >= 40 ? 'ai-score-neutral' : 'ai-score-negative';
  return (
    <div style={{ textAlign: 'center', marginBottom: 16 }}>
      <div className={`ai-score-large ${className}`}>{percentage}%</div>
      {label && <div className="text-muted text-sm">{label}</div>}
    </div>
  );
}

function renderProgressBar(value, label, variant) {
  const pct = Math.round(value * (value <= 1 ? 100 : 1));
  return (
    <div className="skill-bar" key={label}>
      <span className="skill-bar-label">{label}</span>
      <div className="skill-bar-track">
        <div className={`skill-bar-fill ${variant || ''}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="skill-bar-value">{pct}%</span>
    </div>
  );
}

function renderValue(key, value, depth = 0) {
  const lowerKey = key.toLowerCase();

  if (value === null || value === undefined) return null;

  // Score/confidence as large indicator
  if ((lowerKey === 'score' || lowerKey === 'confidence' || lowerKey === 'overallscore' || lowerKey === 'overall_score') && typeof value === 'number') {
    return renderScore(value, key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '));
  }

  // Sentiment
  if (lowerKey === 'sentiment' && typeof value === 'string') {
    const colorMap = { positive: 'badge-success', negative: 'badge-danger', neutral: 'badge-secondary', mixed: 'badge-warning' };
    return <span className={`badge ${colorMap[value.toLowerCase()] || 'badge-primary'}`}>{value}</span>;
  }

  // Emotions / traits as bars
  if ((lowerKey === 'emotions' || lowerKey === 'traits' || lowerKey === 'scores' || lowerKey === 'dimensions') && typeof value === 'object' && !Array.isArray(value)) {
    return (
      <div className="ai-section">
        <div className="ai-section-title">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</div>
        {Object.entries(value).map(([k, v]) =>
          typeof v === 'number' ? renderProgressBar(v, k) : (
            <div key={k} className="skill-bar">
              <span className="skill-bar-label">{k}</span>
              <span className="skill-bar-value">{String(v)}</span>
            </div>
          )
        )}
      </div>
    );
  }

  // Keywords as pills
  if ((lowerKey === 'keywords' || lowerKey === 'tags' || lowerKey === 'topics' || lowerKey === 'categories') && Array.isArray(value)) {
    return (
      <div className="ai-section">
        <div className="ai-section-title">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</div>
        <div className="tags-container">
          {value.map((item, i) => <span key={i} className="tag">{typeof item === 'object' ? item.word || item.name || JSON.stringify(item) : String(item)}</span>)}
        </div>
      </div>
    );
  }

  // Array of objects
  if (Array.isArray(value)) {
    return (
      <div className="ai-section">
        <div className="ai-section-title">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</div>
        {value.map((item, i) => (
          <div key={i} style={{ padding: '8px 12px', background: 'rgba(99,102,241,0.04)', borderRadius: 8, marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            {typeof item === 'object' ? (
              Object.entries(item).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>{k}: </span>
                  <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))
            ) : String(item)}
          </div>
        ))}
      </div>
    );
  }

  // Nested object
  if (typeof value === 'object') {
    return (
      <CollapsibleSection title={key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')} defaultOpen={depth < 1}>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            {renderValue(k, v, depth + 1)}
          </div>
        ))}
      </CollapsibleSection>
    );
  }

  // Number as bar if 0-1 range
  if (typeof value === 'number' && value >= 0 && value <= 1 && lowerKey !== 'id') {
    return renderProgressBar(value, key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '));
  }

  // String / number / boolean
  return (
    <div className="ai-section">
      <div className="ai-section-title">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</div>
      <div className="ai-section-content">{String(value)}</div>
    </div>
  );
}

export default function AIOutput({ data, loading, title }) {
  if (!loading && !data) return null;

  return (
    <div className="ai-output">
      <div className="ai-output-header">
        <div className="ai-icon"><FiCpu /></div>
        <h3>{title || 'AI Analysis Result'}</h3>
      </div>

      {loading ? (
        <div className="ai-typing">
          <div className="ai-typing-dot" />
          <div className="ai-typing-dot" />
          <div className="ai-typing-dot" />
        </div>
      ) : (
        <div>
          {typeof data === 'string' ? (
            <div className="ai-section-content" style={{ whiteSpace: 'pre-wrap' }}>{data}</div>
          ) : typeof data === 'object' && data !== null ? (
            Object.entries(data).map(([key, value]) => (
              <div key={key}>{renderValue(key, value)}</div>
            ))
          ) : (
            <div className="ai-section-content">{String(data)}</div>
          )}
        </div>
      )}
    </div>
  );
}
