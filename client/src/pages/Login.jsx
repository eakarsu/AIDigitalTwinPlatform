import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { FiMail, FiLock, FiZap } from 'react-icons/fi';

const demoEmail = import.meta.env.VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true' ? import.meta.env.VITE_DEMO_EMAIL || '' : '';
const demoPassword = import.meta.env.VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true' ? import.meta.env.VITE_DEMO_PASSWORD || '' : '';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-orb" />
        <div className="login-bg-orb" />
        <div className="login-bg-orb" />
      </div>
      <div className="login-card">
        <h1>AI Digital Twin</h1>
        <p className="login-subtitle">Sign in to your platform</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>
          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="login-divider">or</div>
        <button className="btn btn-secondary w-full" onClick={handleQuickLogin} disabled={loading || !demoEmail || !demoPassword}>
          <FiZap /> Quick Login (Demo)
        </button>
      </div>
    </div>
  );
}
