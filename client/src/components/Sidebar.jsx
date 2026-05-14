import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiUsers, FiCpu, FiMessageSquare, FiDatabase,
  FiActivity, FiSmile, FiBarChart2, FiZap,
  FiBookOpen, FiClock, FiGitBranch, FiFileText, FiSettings, FiBox, FiTool,
  FiLogOut, FiMenu, FiX
} from 'react-icons/fi';

const navItems = [
  { path: '/', icon: FiGrid, label: 'Dashboard' },
  { path: '/twins', icon: FiUsers, label: 'Digital Twins' },
  { path: '/personalities', icon: FiCpu, label: 'Personalities' },
  { path: '/conversations', icon: FiMessageSquare, label: 'Conversations' },
  { path: '/knowledge', icon: FiDatabase, label: 'Knowledge Base' },
  { path: '/behaviors', icon: FiActivity, label: 'Behavior Patterns' },
  { path: '/sentiments', icon: FiSmile, label: 'Sentiment Analysis' },
  { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
  { path: '/memories', icon: FiBox, label: 'Memory System' },
  { path: '/response-generator', icon: FiZap, label: 'Response Generator' },
  { path: '/training', icon: FiBookOpen, label: 'Training Data' },
  { path: '/interactions', icon: FiClock, label: 'Interaction History' },
  { path: '/comparison', icon: FiGitBranch, label: 'Twin Comparison' },
  { path: '/summarizer', icon: FiFileText, label: 'Text Summarizer' },
  { path: '/ai-tools', icon: FiTool, label: 'AI Tools' },
  { path: '/settings', icon: FiSettings, label: 'Settings' },
,
  // // === Batch 02 Gaps & Frontend Mounts ===
  { path: '/cf/continuous-twin-learning', icon: '+', label: 'CF: ContinuousTwinLearning' },
  { path: '/cf/multi-twin-social-dynamics', icon: '+', label: 'CF: MultiTwinSocialDynamics' },
  { path: '/cf/emotional-state-evolution', icon: '+', label: 'CF: EmotionalStateEvolution' },
  { path: '/cf/long-term-relationship-modeling', icon: '+', label: 'CF: LongTermRelationshipMode' },
  { path: '/cf/counterfactual-analysis', icon: '+', label: 'CF: CounterfactualAnalysis' },
  { path: '/gap/missing-generate-conversation-learn-from-interaction-predict', icon: '+', label: 'Gap: MissingGenerateConversat' },
  { path: '/gap/no-conversational-ai-backend-hookup', icon: '+', label: 'Gap: NoConversationalAiBacken' },
  { path: '/gap/limited-llm-provider-integration-openai-anthropic-only-stubs', icon: '+', label: 'Gap: LimitedLlmProviderIntegr' },
  { path: '/gap/no-real-time-interaction-interface', icon: '+', label: 'Gap: NoRealTimeInteractionInt' },
  { path: '/gap/no-multi-user-group-conversation-support', icon: '+', label: 'Gap: NoMultiUserGroupConversa' },
  { path: '/gap/no-payment-billing-module', icon: '+', label: 'Gap: NoPaymentBillingModule' },
  { path: '/gap/no-reporting-beyond-stubs', icon: '+', label: 'Gap: NoReportingBeyondStubs' }
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch { return {}; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = (user.name || user.email || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <FiX /> : <FiMenu />}
      </button>
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <FiCpu />
          </div>
          <div>
            <h1>Digital Twin</h1>
            <span>AI Platform</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <p>{user.name || user.email || 'User'}</p>
            <span>{user.role || 'admin'}</span>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </aside>
    </>
  );
}
