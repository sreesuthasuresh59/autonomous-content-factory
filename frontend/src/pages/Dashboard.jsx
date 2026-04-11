// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const STATUS_CONFIG = {
  pending: {
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.1)',
    border: 'rgba(148,163,184,0.2)',
    label: 'Pending',
    icon: '⏳'
  },
  processing: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
    label: 'Processing',
    icon: '⚡'
  },
  completed: {
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.2)',
    label: 'Completed',
    icon: '✅'
  },
  failed: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.2)',
    label: 'Failed',
    icon: '❌'
  }
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const Dashboard = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        'http://localhost:5000/api/campaign/list',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCampaigns(response.data.campaigns || []);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }

      setError(err.response?.data?.error || 'Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [logout, navigate, token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Your session expired. Please log in again.');
      return;
    }

    fetchCampaigns();
  }, [token, fetchCampaigns]);

  const handleOpenCampaign = (campaign) => {
    localStorage.setItem('campaign_id', campaign.id);
    localStorage.setItem('campaignSource', JSON.stringify({
      filename: campaign.source_name,
      input_type: campaign.input_type,
      campaign_id: campaign.id
    }));

    if (campaign.status === 'completed') {
      navigate('/review');
    } else {
      navigate('/agent-room');
    }
  };

  const handleNewCampaign = () => {
    localStorage.removeItem('campaign_id');
    localStorage.removeItem('campaignSource');
    navigate('/upload');
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  // ─── Stats ───────────────────────────────────────────────────────
  const stats = {
    total: campaigns.length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    processing: campaigns.filter(c => c.status === 'processing').length,
    failed: campaigns.filter(c => c.status === 'failed').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid var(--border-accent)',
              borderRadius: '20px', padding: '0.3rem 1rem',
              marginBottom: '0.8rem'
            }}>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--accent-purple)',
                fontWeight: 600
              }}>
                DASHBOARD
              </span>
            </div>
            <h1 style={{
              fontSize: '1.8rem', fontWeight: 800,
              color: 'var(--text-primary)', marginBottom: '0.4rem'
            }}>
              My Campaigns
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Welcome back, {user?.email?.split('@')[0]} 👋
            </p>
          </div>
          <Button onClick={handleNewCampaign} size="lg">
            ⚡ New Campaign
          </Button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem', marginBottom: '2rem'
        }}>
          {[
            { label: 'Total Campaigns', value: stats.total, color: 'var(--accent-purple)', icon: '📁' },
            { label: 'Completed', value: stats.completed, color: '#22c55e', icon: '✅' },
            { label: 'Processing', value: stats.processing, color: '#f59e0b', icon: '⚡' },
            { label: 'Failed', value: stats.failed, color: '#ef4444', icon: '❌' },
          ].map((stat, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.2rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: '0.6rem'
              }}>
                <span style={{ fontSize: '1.3rem' }}>{stat.icon}</span>
                <span style={{
                  fontSize: '0.75rem', color: 'var(--text-muted)',
                  fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {stat.label}
                </span>
              </div>
              <div style={{
                fontSize: '2.2rem', fontWeight: 800, color: stat.color
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex', gap: '0.5rem',
          marginBottom: '1.5rem', flexWrap: 'wrap'
        }}>
          {['all', 'completed', 'processing', 'pending', 'failed'].map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px', border: 'none',
                background: filter === f
                  ? 'var(--gradient-main)'
                  : 'var(--bg-secondary)',
                color: filter === f ? 'white' : 'var(--text-secondary)',
                fontWeight: 600, cursor: 'pointer',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-main)',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}>
              {f === 'all' ? `All (${stats.total})` : f}
            </button>
          ))}
          <button
            onClick={fetchCampaigns}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontWeight: 600, cursor: 'pointer',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-main)',
              marginLeft: 'auto'
            }}>
            🔄 Refresh
          </button>
        </div>

        {/* Campaign List */}
        {loading ? (
          <div style={{
            display: 'flex', justifyContent: 'center',
            padding: '4rem'
          }}>
            <Loader text="Loading campaigns..." />
          </div>
        ) : error ? (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem', color: '#f87171', fontSize: '0.9rem'
          }}>
            ❌ {error}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{
              color: 'var(--text-primary)',
              fontWeight: 700, marginBottom: '0.5rem'
            }}>
              No campaigns found
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem', marginBottom: '1.5rem'
            }}>
              {filter === 'all'
                ? "You haven't created any campaigns yet."
                : `No ${filter} campaigns found.`}
            </p>
            <Button onClick={handleNewCampaign}>
              ⚡ Create Your First Campaign
            </Button>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '1rem'
          }}>
            {filteredCampaigns.map(campaign => {
              const config = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.pending;
              return (
                <div key={campaign.id}
                  className="glass-card"
                  style={{
                    padding: '1.4rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--border-accent)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => handleOpenCampaign(campaign)}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
                  }}>
                    {/* Left — Info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: '0.8rem', marginBottom: '0.4rem'
                      }}>
                        <div style={{
                          width: 38, height: 38,
                          background: 'var(--gradient-main)',
                          borderRadius: '10px',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '1rem',
                          flexShrink: 0
                        }}>
                          {campaign.input_type === 'file' ? '📄' : '🔗'}
                        </div>
                        <div>
                          <h3 style={{
                            color: 'var(--text-primary)',
                            fontWeight: 700, fontSize: '0.98rem', margin: 0
                          }}>
                            {campaign.title || 'Untitled Campaign'}
                          </h3>
                          <p style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.8rem', margin: '2px 0 0'
                          }}>
                            {campaign.source_name || 'Unknown source'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Middle — Meta */}
                    <div style={{
                      display: 'flex', gap: '1.5rem',
                      alignItems: 'center', flexWrap: 'wrap'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.72rem', fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em', marginBottom: '2px'
                        }}>
                          Type
                        </p>
                        <p style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.85rem', fontWeight: 500
                        }}>
                          {campaign.input_type === 'file' ? '📄 File' : '🔗 URL'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.72rem', fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em', marginBottom: '2px'
                        }}>
                          Created
                        </p>
                        <p style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.82rem'
                        }}>
                          {formatDate(campaign.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Right — Status + Action */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '1rem'
                    }}>
                      <div style={{
                        background: config.bg,
                        border: `1px solid ${config.border}`,
                        borderRadius: '20px', padding: '4px 14px',
                        fontSize: '0.8rem', color: config.color,
                        fontWeight: 600, whiteSpace: 'nowrap'
                      }}>
                        {config.icon} {config.label}
                      </div>
                      <Button
                        onClick={e => { e.stopPropagation(); handleOpenCampaign(campaign); }}
                        variant={campaign.status === 'completed' ? 'primary' : 'outline'}
                        size="sm"
                      >
                        {campaign.status === 'completed' ? '👁️ View' : '▶️ Open'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
