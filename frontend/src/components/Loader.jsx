// frontend/src/components/Loader.jsx
import React from 'react';

const Loader = ({ text = 'Processing...' }) => (
  <div style={{
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '1rem'
  }}>
    <div style={{
      width: 40, height: 40,
      border: '3px solid var(--border-subtle)',
      borderTop: '3px solid var(--accent-purple)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{text}</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default Loader;