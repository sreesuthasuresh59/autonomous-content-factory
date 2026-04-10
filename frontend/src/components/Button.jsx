// frontend/src/components/Button.jsx
import React from 'react';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  size = 'md'
}) => {
  const sizes = {
    sm: { padding: '8px 18px', fontSize: '0.85rem' },
    md: { padding: '12px 28px', fontSize: '0.95rem' },
    lg: { padding: '15px 36px', fontSize: '1.05rem' },
  };

  const variants = {
    primary: {
      background: 'var(--gradient-main)',
      color: 'white',
      border: 'none',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-accent)',
    },
    ghost: {
      background: 'var(--glass-bg)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--glass-border)',
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 'var(--radius-sm)',
        fontWeight: 600,
        fontFamily: 'var(--font-main)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {children}
    </button>
  );
};

export default Button;