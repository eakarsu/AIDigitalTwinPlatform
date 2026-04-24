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
import Settings from './pages/Settings';

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
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
