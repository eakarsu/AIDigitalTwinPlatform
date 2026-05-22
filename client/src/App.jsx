import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DigitalTwins from './pages/DigitalTwins';
import TwinDetail from './pages/TwinDetail';
import Personalities from './pages/Personalities';
import Conversations from './pages/Conversations';
import KnowledgeBase from './pages/KnowledgeBase';
import BehaviorPatterns from './pages/BehaviorPatterns';
import SentimentAnalysis from './pages/SentimentAnalysis';
import Analytics from './pages/Analytics';
import MemorySystem from './pages/MemorySystem';
import ResponseGenerator from './pages/ResponseGenerator';
import TrainingData from './pages/TrainingData';
import InteractionHistory from './pages/InteractionHistory';
import TwinComparison from './pages/TwinComparison';
import TextSummarizer from './pages/TextSummarizer';
import AITools from './pages/AITools';
import Settings from './pages/Settings';
import TwinDriftMonitor from './pages/TwinDriftMonitor';

// // === Batch 02 Gaps & Frontend Mounts ===
import CfContinuousTwinLearning from './pages/CfContinuousTwinLearning';
import CfMultiTwinSocialDynamics from './pages/CfMultiTwinSocialDynamics';
import CfEmotionalStateEvolution from './pages/CfEmotionalStateEvolution';
import CfLongTermRelationshipModeling from './pages/CfLongTermRelationshipModeling';
import CfCounterfactualAnalysis from './pages/CfCounterfactualAnalysis';
import GapMissingGenerateConversationLearnFromInteractionPredict from './pages/GapMissingGenerateConversationLearnFromInteractionPredict';
import GapNoConversationalAiBackendHookup from './pages/GapNoConversationalAiBackendHookup';
import GapLimitedLlmProviderIntegrationOpenaiAnthropicOnlyStubs from './pages/GapLimitedLlmProviderIntegrationOpenaiAnthropicOnlyStubs';
import GapNoRealTimeInteractionInterface from './pages/GapNoRealTimeInteractionInterface';
import GapNoMultiUserGroupConversationSupport from './pages/GapNoMultiUserGroupConversationSupport';
import GapNoPaymentBillingModule from './pages/GapNoPaymentBillingModule';
import GapNoReportingBeyondStubs from './pages/GapNoReportingBeyondStubs';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1625',
            color: '#e2e8f0',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1a1625' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1a1625' } },
        }}
      />
      <Routes>
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/twins" element={<ProtectedRoute><DigitalTwins /></ProtectedRoute>} />
        <Route path="/twins/:id" element={<ProtectedRoute><TwinDetail /></ProtectedRoute>} />
        <Route path="/personalities" element={<ProtectedRoute><Personalities /></ProtectedRoute>} />
        <Route path="/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
        <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
        <Route path="/behaviors" element={<ProtectedRoute><BehaviorPatterns /></ProtectedRoute>} />
        <Route path="/sentiments" element={<ProtectedRoute><SentimentAnalysis /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/memories" element={<ProtectedRoute><MemorySystem /></ProtectedRoute>} />
        <Route path="/response-generator" element={<ProtectedRoute><ResponseGenerator /></ProtectedRoute>} />
        <Route path="/training" element={<ProtectedRoute><TrainingData /></ProtectedRoute>} />
        <Route path="/interactions" element={<ProtectedRoute><InteractionHistory /></ProtectedRoute>} />
        <Route path="/comparison" element={<ProtectedRoute><TwinComparison /></ProtectedRoute>} />
        <Route path="/summarizer" element={<ProtectedRoute><TextSummarizer /></ProtectedRoute>} />
        <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/twin-drift-monitor" element={<ProtectedRoute><TwinDriftMonitor /></ProtectedRoute>} />
      
        {/* // === Batch 02 Gaps & Frontend Mounts === */}
        <Route path="/cf/continuous-twin-learning" element={<CfContinuousTwinLearning />} />
        <Route path="/cf/multi-twin-social-dynamics" element={<CfMultiTwinSocialDynamics />} />
        <Route path="/cf/emotional-state-evolution" element={<CfEmotionalStateEvolution />} />
        <Route path="/cf/long-term-relationship-modeling" element={<CfLongTermRelationshipModeling />} />
        <Route path="/cf/counterfactual-analysis" element={<CfCounterfactualAnalysis />} />
        <Route path="/gap/missing-generate-conversation-learn-from-interaction-predict" element={<GapMissingGenerateConversationLearnFromInteractionPredict />} />
        <Route path="/gap/no-conversational-ai-backend-hookup" element={<GapNoConversationalAiBackendHookup />} />
        <Route path="/gap/limited-llm-provider-integration-openai-anthropic-only-stubs" element={<GapLimitedLlmProviderIntegrationOpenaiAnthropicOnlyStubs />} />
        <Route path="/gap/no-real-time-interaction-interface" element={<GapNoRealTimeInteractionInterface />} />
        <Route path="/gap/no-multi-user-group-conversation-support" element={<GapNoMultiUserGroupConversationSupport />} />
        <Route path="/gap/no-payment-billing-module" element={<GapNoPaymentBillingModule />} />
        <Route path="/gap/no-reporting-beyond-stubs" element={<GapNoReportingBeyondStubs />} />
      </Routes>
    </>
  );
}
