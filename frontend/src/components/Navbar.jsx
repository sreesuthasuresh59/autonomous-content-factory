// frontend/src/components/Navbar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'New Campaign', path: '/upload' },
  ];

  return (
    <nav style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.2rem 2.5rem',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10,10,15,0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex', alignItems: 'center',
          gap: '0.6rem', cursor: 'pointer'
        }}
      >
        <div style={{
          width: 36, height: 36,
          background: 'var(--gradient-main)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.1rem'
        }}>⚡</div>
        <span style={{
          fontWeight: 700, fontSize: '1.1rem',
          background: 'var(--gradient-main)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ContentFactory
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '2rem' }}>
        {navLinks.map(link => (
          <span
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              color: location.pathname === link.path
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.9rem',
              fontWeight: location.pathname === link.path ? 600 : 500,
              transition: 'color 0.2s',
              borderBottom: location.pathname === link.path
                ? '2px solid var(--accent-purple)'
                : '2px solid transparent',
              paddingBottom: '2px'
            }}
            onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={e => {
              if (location.pathname !== link.path) {
                e.target.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {link.label}
          </span>
        ))}
      </div>

      {/* User Badge + Logout */}
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
              cursor: 'pointer',
              fontFamily: 'var(--font-main)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.target.style.borderColor = 'var(--border-accent)'}
            onMouseLeave={e => e.target.style.borderColor = 'var(--glass-border)'}
          >
            Logout
          </button>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;