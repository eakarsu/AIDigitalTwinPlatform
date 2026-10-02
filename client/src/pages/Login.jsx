import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { FiMail, FiLock, FiZap } from 'react-icons/fi';

function __demoAutofill() {
  (async () => {
    let email = "";
    let password = "";
    try {
      const response = await fetch("/api/auth/demo-credentials", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        email = data.email || data.username || "";
        password = data.password || "";
      }
    } catch (error) {
      /* fall back to build-time credentials below */
    }
    if (!email || !password) {
      const env = (typeof process !== "undefined" && process.env) ? process.env : {};
      email = email || env.REACT_APP_DEMO_EMAIL || env.VITE_DEMO_EMAIL || "";
      password = password || env.REACT_APP_DEMO_PASSWORD || env.VITE_DEMO_PASSWORD || "";
    }
    const form = document.querySelector("form");
    const setValue = (element, value) => {
      if (!element) return;
      const prototype = element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
      setter.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const scope = form || document;
    setValue(scope.querySelector('input[type="email"], input[name="email"], input[name="username"]') || scope.querySelectorAll("input")[0], email);
    setValue(scope.querySelector('input[type="password"], input[name="password"]') || scope.querySelectorAll("input")[1], password);
    window.setTimeout(() => {
      if (form && typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        const submit = scope.querySelector('button[type="submit"], input[type="submit"]');
        if (submit) submit.click();
      }
    }, 50);
  })();
}

const demoEmail = import.meta.env.VITE_DEMO_EMAIL || '';
const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || '';

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

  const handleQuickLogin = () => {
    setEmail(demoEmail);
    setPassword(demoPassword);
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
                required
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
                required
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>
          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="login-divider">or</div>
        <button type="button" className="btn btn-secondary w-full" onClick={__demoAutofill} aria-label="Auto Fill Demo Credentials">
          <FiZap /> Auto Fill Demo Credentials
        </button>
      </div>
    </div>
  );
}
