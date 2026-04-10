// frontend/src/components/Navbar.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();   // ✅ added
  const navigate = useNavigate();       // ✅ added

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.2rem 2.5rem',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10,10,15,0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--gradient-main)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem'
        }}>⚡</div>

      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '2rem' }}>
        {['Dashboard', 'Campaigns', 'Settings'].map(link => (
          <span
            key={link}
            style={{
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
          >
            {link}
          </span>
        ))}
      </div>

      {/* ✅ FIXED USER SECTION */}
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

          <span style={{
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}>
            {user.email}
          </span>

          <button
            onClick={handleLogout}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '0.4rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>

        </div>
      ) : null}

    </nav>
  );
};

export default Navbar;
