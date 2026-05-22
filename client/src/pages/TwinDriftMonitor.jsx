import React, { useEffect, useState } from 'react';

export default function TwinDriftMonitor() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/twin-drift-monitor').then(r => r.json()).then(setData).catch(() => setData(null)); }, []);
  return <div className="page"><h1>Twin Drift Monitor</h1><p>Detect behavioral, memory, and tone drift across digital twins.</p><div className="stats-grid">{data && Object.entries(data.summary).map(([k,v]) => <div className="stat-card" key={k}><span>{k.replaceAll('_',' ')}</span><strong>{v}</strong></div>)}</div><div className="card">{(data?.twins || []).map(t => <div key={t.twin} style={{padding:12,borderBottom:'1px solid #e5e7eb'}}><strong>{t.twin}</strong><div>{t.drift} - {t.score}% - {t.action}</div></div>)}</div></div>;
}
