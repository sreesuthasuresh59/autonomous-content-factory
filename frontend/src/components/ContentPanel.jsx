// frontend/src/components/ContentPanel.jsx
import React, { useState } from 'react';
import Button from './Button';

const ContentPanel = ({ blog, social, email, onRegenerate }) => {
  const [activeTab, setActiveTab] = useState('blog');

  const tabs = [
    { id: 'blog', label: '📝 Blog Post', data: blog },
    { id: 'social', label: '📱 Social Thread', data: social },
    { id: 'email', label: '📧 Email Teaser', data: email },
  ];

  const renderBlog = () => (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '1rem'
      }}>
        <div>
          <h3 style={{
            color: 'var(--text-primary)',
            fontSize: '1.1rem', fontWeight: 700,
            marginBottom: '0.2rem'
          }}>
            {blog?.title || 'Blog Post'}
          </h3>
          <span style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid var(--border-accent)',
            borderRadius: '20px', padding: '2px 10px',
            fontSize: '0.75rem', color: 'var(--accent-purple)',
            fontWeight: 600
          }}>
            {blog?.tone_used || 'Professional'} · {blog?.word_count || '~500'} words
          </span>
        </div>
      </div>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-sm)',
        padding: '1.2rem',
        border: '1px solid var(--border-subtle)',
        maxHeight: 420,
        overflowY: 'auto'
      }}>
        {blog?.content?.split('\n\n').map((para, i) => (
          <p key={i} style={{
            color: 'var(--text-secondary)',
            fontSize: '0.92rem',
            lineHeight: 1.75,
            marginBottom: '1rem'
          }}>
            {para}
          </p>
        ))}
      </div>
    </div>
  );

  const renderSocial = () => (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <span style={{
          background: 'rgba(59,130,246,0.15)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: '20px', padding: '2px 10px',
          fontSize: '0.75rem', color: '#60a5fa',
          fontWeight: 600
        }}>
          {social?.tone_used || 'Engaging'} · 5 Posts
        </span>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '0.8rem',
        maxHeight: 420, overflowY: 'auto'
      }}>
        {social?.posts?.map((post, i) => (
          <div key={i} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '0.5rem', marginBottom: '0.5rem'
            }}>
              <div style={{
                width: 24, height: 24,
                background: 'var(--gradient-main)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700,
                color: 'white', flexShrink: 0
              }}>
                {post.number}
              </div>
              <span style={{
                color: 'var(--text-muted)',
                fontSize: '0.75rem'
              }}>
                {post.content?.length || 0} chars
              </span>
            </div>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem', lineHeight: 1.6, margin: 0
            }}>
              {post.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEmail = () => (
    <div>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '1.2rem',
        marginBottom: '1rem'
      }}>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.75rem', fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em', marginBottom: '0.4rem'
        }}>
          Subject Line
        </p>
        <p style={{
          color: 'var(--accent-blue)',
          fontSize: '0.95rem', fontWeight: 600
        }}>
          {email?.subject_line || 'No subject'}
        </p>
      </div>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '1.2rem'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '0.8rem'
        }}>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.75rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            Email Body
          </p>
          <span style={{
            background: 'rgba(6,182,212,0.15)',
            border: '1px solid rgba(6,182,212,0.3)',
            borderRadius: '20px', padding: '2px 10px',
            fontSize: '0.75rem', color: '#22d3ee',
            fontWeight: 600
          }}>
            {email?.tone_used || 'Formal'} · {email?.word_count || '~100'} words
          </span>
        </div>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.92rem', lineHeight: 1.75, margin: 0
        }}>
          {email?.content}
        </p>
      </div>
    </div>
  );

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      {/* Tab Header */}
      <div style={{
        display: 'flex', gap: '0.5rem',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px', marginBottom: '1.5rem'
      }}>
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '0.6rem',
              borderRadius: '6px', border: 'none',
              background: activeTab === tab.id
                ? 'var(--gradient-main)'
                : 'transparent',
              color: activeTab === tab.id
                ? 'white'
                : 'var(--text-secondary)',
              fontWeight: 600, cursor: 'pointer',
              fontSize: '0.85rem', transition: 'all 0.2s',
              fontFamily: 'var(--font-main)'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'blog' && renderBlog()}
      {activeTab === 'social' && renderSocial()}
      {activeTab === 'email' && renderEmail()}

      {/* Regenerate Button */}
      {onRegenerate && (
        <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onRegenerate} variant="outline" size="sm">
            🔄 Regenerate Content
          </Button>
        </div>
      )}
    </div>
  );
};

export default ContentPanel;