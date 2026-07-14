import React, { useState } from 'react';
import { Lock, User, Shield, ArrowRight } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function Auth({ onLoginSuccess, showToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password', 'error');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { username, password } 
      : { username, password, role };

    try {
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showToast(isLogin ? `Welcome back, ${data.username}!` : 'Account registered successfully!', 'success');
      onLoginSuccess(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Shield size={32} />
          </div>
          <h2>Demo Ticket</h2>
          <p>Enterprise Ticketing and Helpdesk</p>
        </div>

        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username-input">Username</label>
            <div className="search-input-wrapper" style={{ minWidth: 'auto', maxWidth: 'none' }}>
              <User size={18} className="search-icon" />
              <input 
                id="username-input"
                type="text" 
                className="input-field" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password-input">Password</label>
            <div className="search-input-wrapper" style={{ minWidth: 'auto', maxWidth: 'none' }}>
              <Lock size={18} className="search-icon" />
              <input 
                id="password-input"
                type="password" 
                className="input-field" 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="role-select">Select Profile Role</label>
              <select 
                id="role-select"
                className="input-field" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User (Raise tickets & view own)</option>
                <option value="agent">Agent (Assign & solve tickets)</option>
                <option value="admin">Admin (Full Control + Delete)</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '0.25rem' }}>Demo credentials available for testing:</p>
          <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
            admin / admin123 | agent / agent123 | user / user123
          </code>
        </div>
      </div>
    </div>
  );
}
