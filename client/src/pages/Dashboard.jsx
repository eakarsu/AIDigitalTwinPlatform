import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiMessageSquare, FiDatabase, FiSmile,
  FiCpu, FiActivity, FiBarChart2, FiBox, FiZap,
  FiBookOpen, FiClock, FiGitBranch, FiFileText, FiSettings
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';

const features = [
  { path: '/twins', icon: FiUsers, title: 'Digital Twins', desc: 'Create and manage AI digital twins', key: 'twins' },
  { path: '/personalities', icon: FiCpu, title: 'Personalities', desc: 'Define personality profiles for twins', key: 'personalities' },
  { path: '/conversations', icon: FiMessageSquare, title: 'Conversations', desc: 'Chat with your digital twins', key: 'conversations' },
  { path: '/knowledge', icon: FiDatabase, title: 'Knowledge Base', desc: 'Manage knowledge entries', key: 'knowledge' },
  { path: '/behaviors', icon: FiActivity, title: 'Behavior Patterns', desc: 'Analyze behavioral data', key: 'behaviors' },
  { path: '/sentiments', icon: FiSmile, title: 'Sentiment Analysis', desc: 'Analyze text sentiment and emotions', key: 'sentiments' },
  { path: '/analytics', icon: FiBarChart2, title: 'Analytics', desc: 'View platform metrics and insights', key: 'analytics' },
  { path: '/memories', icon: FiBox, title: 'Memory System', desc: 'Manage episodic and semantic memories', key: 'memories' },
  { path: '/response-generator', icon: FiZap, title: 'Response Generator', desc: 'Generate AI responses from twins', key: 'responses' },
  { path: '/training', icon: FiBookOpen, title: 'Training Data', desc: 'Build training datasets', key: 'training' },
  { path: '/interactions', icon: FiClock, title: 'Interaction History', desc: 'Browse all past interactions', key: 'interactions' },
  { path: '/comparison', icon: FiGitBranch, title: 'Twin Comparison', desc: 'Compare two twins side by side', key: 'comparison' },
  { path: '/summarizer', icon: FiFileText, title: 'Text Summarizer', desc: 'Summarize text with AI', key: 'summarizer' },
  { path: '/settings', icon: FiSettings, title: 'Settings', desc: 'Configure platform settings', key: 'settings' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ totalTwins: 0, activeConversations: 0, knowledgeItems: 0, avgSentiment: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/analytics/dashboard');
        setStats({
          totalTwins: data.totalTwins || data.twins || 0,
          activeConversations: data.activeConversations || data.conversations || 0,
          knowledgeItems: data.knowledgeItems || data.knowledge || 0,
          avgSentiment: data.avgSentiment || data.averageSentiment || 0,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon primary"><FiUsers /></div>
          <div className="stat-card-value">{loading ? '--' : stats.totalTwins}</div>
          <div className="stat-card-label">Total Twins</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon secondary"><FiMessageSquare /></div>
          <div className="stat-card-value">{loading ? '--' : stats.activeConversations}</div>
          <div className="stat-card-label">Active Conversations</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon accent"><FiDatabase /></div>
          <div className="stat-card-value">{loading ? '--' : stats.knowledgeItems}</div>
          <div className="stat-card-label">Knowledge Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon warning"><FiSmile /></div>
          <div className="stat-card-value">{loading ? '--' : typeof stats.avgSentiment === 'number' ? (stats.avgSentiment * 100).toFixed(0) + '%' : stats.avgSentiment}</div>
          <div className="stat-card-label">Avg Sentiment</div>
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>Features</h2>
      <div className="feature-grid">
        {features.map(f => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <div className="feature-card-icon"><f.icon /></div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
