// frontend/src/components/ChatFeed.jsx
import React, { useEffect, useRef } from 'react';

const MESSAGE_STYLES = {
  system: { color: 'var(--text-muted)', prefix: 'System' },
  agent1: { color: '#7c3aed', prefix: 'Fact-Checker' },
  agent2: { color: '#3b82f6', prefix: 'Copywriter' },
  agent3: { color: '#06b6d4', prefix: 'Editor' },
  success: { color: '#22c55e', prefix: 'Success' },
  error: { color: '#ef4444', prefix: 'Error' },
  warning: { color: '#f59e0b', prefix: 'Warning' },
};

const ChatFeed = ({ messages = [] }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '1rem',
      height: 320,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem'
    }}>
      {messages.length === 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', height: '100%'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Agent activity will appear here...
          </p>
        </div>
      ) : (
        messages.map((msg, i) => {
          const style = MESSAGE_STYLES[msg.type] || MESSAGE_STYLES.system;
          return (
            <div key={i} style={{
              display: 'flex', gap: '0.6rem', alignItems: 'flex-start'
            }}>
              {/* Timestamp */}
              <span style={{
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                paddingTop: '2px',
                flexShrink: 0
              }}>
                {msg.time || new Date().toLocaleTimeString([], {
                  hour: '2-digit', minute: '2-digit', second: '2-digit'
                })}
              </span>

              {/* Message */}
              <div style={{ flex: 1 }}>
                <span style={{
                  color: style.color,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  marginRight: '0.5rem'
                }}>
                  {style.prefix}
                </span>
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5
                }}>
                  {msg.text}
                </span>
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatFeed;