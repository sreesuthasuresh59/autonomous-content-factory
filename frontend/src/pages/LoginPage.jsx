// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Loader from '../components/Loader';
import axios from 'axios';

const LoginPage = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login'
        ? 'http://localhost:5000/api/auth/login'
        : 'http://localhost:5000/api/auth/signup';

      const response = await axios.post(endpoint, { email, password });

      if (mode === 'signup') {
        setSuccess(' Account created! Please check your email to confirm, then log in.');
        setMode('login');
      } else {
        login(response.data.user, response.data.access_token);
        navigate('/upload');
      }
    } catch (err) {
      setError(err.response?.data?.error || ' Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.9rem 1.1rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'var(--font-main)',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52,
            background: 'var(--gradient-main)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            margin: '0 auto 1rem'
          }}>⚡</div>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 800,
            background: 'var(--gradient-main)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ContentFactory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            AI-Powered Campaign Generation
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '2rem' }}>

          {/* Mode Toggle */}
          <div style={{
            display: 'flex', gap: '0.5rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px', marginBottom: '1.8rem'
          }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                style={{
                  flex: 1, padding: '0.6rem',
                  borderRadius: '6px', border: 'none',
                  background: mode === m ? 'var(--gradient-main)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600, cursor: 'pointer',
                  fontSize: '0.9rem', transition: 'all 0.2s'
                }}>
                {m === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block', color: 'var(--text-secondary)',
                fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500
              }}>Email Address</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <div>
              <label style={{
                display: 'block', color: 'var(--text-secondary)',
                fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 500
              }}>Password</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              {mode === 'signup' && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                  Minimum 6 characters
                </p>
              )}
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.8rem', color: '#f87171',
              fontSize: '0.88rem', marginTop: '1rem'
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.8rem', color: '#4ade80',
              fontSize: '0.88rem', marginTop: '1rem'
            }}>{success}</div>
          )}

          {/* Submit */}
          <div style={{ marginTop: '1.5rem' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
                <Loader text={mode === 'login' ? 'Logging in...' : 'Creating account...'} />
              </div>
            ) : (
              <Button onClick={handleSubmit} fullWidth size="lg">
                {mode === 'login' ? 'Login' : ' Create Account'}
              </Button>
            )}
          </div>
        </div>

        <p style={{
          textAlign: 'center', color: 'var(--text-muted)',
          fontSize: '0.8rem', marginTop: '1.5rem'
        }}>
          Your data is secured with Supabase RLS
        </p>
      </div>
    </div>
  );
};

export default LoginPage;