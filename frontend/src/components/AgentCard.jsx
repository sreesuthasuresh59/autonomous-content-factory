// frontend/src/components/AgentCard.jsx
import React from 'react';

const STATUS_CONFIG = {
  idle: {
    color: 'var(--text-muted)',
    bg: 'rgba(255,255,255,0.03)',
    border: 'var(--border-subtle)',
    icon: '⏳',
    label: 'Waiting'
  },
  thinking: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.3)',
    icon: '🧠',
    label: 'Thinking...'
  },
  working: {
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.3)',
    icon: '⚡',
    label: 'Working...'
  },
  done: {
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.3)',
    icon: '✅',
    label: 'Done'
  },
  error: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
    icon: '❌',
    label: 'Failed'
  }
};

const AgentCard = ({ name, role, description, status = 'idle', output = null }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <div style={{
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 'var(--radius-md)',
      padding: '1.5rem',
      transition: 'all 0.3s ease',
      boxShadow: status === 'working' || status === 'thinking'
        ? `0 0 20px ${config.border}`
        : 'none'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            width: 44, height: 44,
            background: 'var(--gradient-main)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.3rem',
            flexShrink: 0
          }}>
            {config.icon}
          </div>
          <div>
            <h3 style={{
              color: 'var(--text-primary)',
              fontWeight: 700, fontSize: '1rem', margin: 0
            }}>{name}</h3>
            <p style={{
              color: config.color,
              fontSize: '0.78rem', fontWeight: 600,
              margin: '2px 0 0', textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>{config.label}</p>
          </div>
        </div>

        {/* Pulse animation when active */}
        {(status === 'thinking' || status === 'working') && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', paddingTop: '4px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: config.color,
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Role Badge */}
      <div style={{
        display: 'inline-block',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '20px',
        padding: '2px 10px',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        marginBottom: '0.6rem'
      }}>
        {role}
      </div>

      {/* Description */}
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '0.88rem', lineHeight: 1.5, margin: 0
      }}>
        {description}
      </p>

      {/* Output Preview */}
      {output && status === 'done' && (
        <div style={{
          marginTop: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.8rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.4rem'
          }}>Output Preview</p>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            fontFamily: 'var(--font-mono)',
            wordBreak: 'break-word'
          }}>
            {typeof output === 'string'
              ? output.substring(0, 120) + '...'
              : JSON.stringify(output).substring(0, 120) + '...'}
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default AgentCard;