// frontend/src/pages/AgentRoom.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AgentCard from '../components/AgentCard';
import ChatFeed from '../components/ChatFeed';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Helper to get current time string
const now = () => new Date().toLocaleTimeString([], {
  hour: '2-digit', minute: '2-digit', second: '2-digit'
});

const AgentRoom = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Agent statuses
  const [agent1Status, setAgent1Status] = useState('idle');
  const [agent2Status, setAgent2Status] = useState('idle');
  const [agent3Status, setAgent3Status] = useState('idle');

  // Agent outputs
  const [factSheet, setFactSheet] = useState(null);

  // UI state
  const [messages, setMessages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [campaignId, setCampaignId] = useState(null);
  const [campaignSource, setCampaignSource] = useState(null);

  // Add message to chat feed
  const addMessage = useCallback((text, type = 'system') => {
    setMessages(prev => [...prev, { text, type, time: now() }]);
  }, []);

  // Load campaign data from localStorage
  useEffect(() => {
    const source = localStorage.getItem('campaignSource');
    const id = localStorage.getItem('campaign_id');

    if (!source || !id) {
      navigate('/upload');
      return;
    }

    setCampaignSource(JSON.parse(source));
    setCampaignId(id);

    addMessage('Campaign loaded and ready to process.', 'system');
    addMessage(`Source: ${JSON.parse(source).filename || JSON.parse(source).source || 'Unknown'}`, 'system');
  }, [navigate, addMessage]);

  // ─── Run Fact-Check Agent ────────────────────────────────────────
  const runFactCheckAgent = async () => {
    if (!campaignId) return;

    setIsRunning(true);
    setError('');
    setAgent1Status('thinking');

    addMessage('Initializing Fact-Check Agent...', 'agent1');

    try {
      // Small delay for UX — shows "thinking" state
      await new Promise(r => setTimeout(r, 800));
      setAgent1Status('working');
      addMessage('Reading source document and extracting facts...', 'agent1');

      await new Promise(r => setTimeout(r, 600));
      addMessage('Building structured fact-sheet from source content...', 'agent1');

      const response = await axios.post(
        `http://localhost:5000/api/campaign/${campaignId}/fact-check`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = response.data;

      if (result.status === 'success') {
        setFactSheet(result.fact_sheet);
        setAgent1Status('done');

        addMessage('Fact-sheet successfully generated ✅', 'success');
        addMessage(
          `Extracted: ${result.fact_sheet.core_features?.length || 0} features, ` +
          `${result.fact_sheet.target_audience?.length || 0} audience segments`,
          'agent1'
        );
        addMessage(
          `Confidence Score: ${((result.confidence_score || 0) * 100).toFixed(0)}% | ` +
          `Source Quality: ${result.source_quality || 'unknown'}`,
          'agent1'
        );

        if (result.has_warnings) {
          result.warnings.forEach(w => addMessage(w, 'warning'));
        }

        addMessage('Fact-Check Agent complete. Source of Truth is locked. 🔒', 'agent1');
      }

    } catch (err) {
      setAgent1Status('error');
      const msg = err.response?.data?.error || 'Fact-check agent failed';
      setError(msg);
      addMessage(`Error: ${msg}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // ─── Render Fact Sheet ───────────────────────────────────────────
  const renderFactSheet = () => {
    if (!factSheet) return null;

    const sections = [
      {
        title: '🏷️ Product / Topic',
        content: factSheet.product_or_topic || 'N/A'
      },
      {
        title: '🏢 Company / Brand',
        content: factSheet.company_or_brand || 'N/A'
      },
      {
        title: '💡 Value Proposition',
        content: factSheet.value_proposition || 'N/A'
      },
      {
        title: '⚡ Core Features',
        content: factSheet.core_features?.length
          ? factSheet.core_features
          : ['None found']
      },
      {
        title: '🎯 Target Audience',
        content: factSheet.target_audience?.length
          ? factSheet.target_audience
          : ['None found']
      },
      {
        title: '📊 Key Statistics',
        content: factSheet.key_statistics?.length
          ? factSheet.key_statistics
          : ['None found']
      },
      {
        title: '💰 Pricing',
        content: factSheet.pricing?.plans?.length
          ? factSheet.pricing.plans.map(p => `${p.name}: ${p.price}`)
          : ['No pricing info found']
      },
      {
        title: '⚠️ Ambiguous Statements',
        content: factSheet.ambiguous_statements?.length
          ? factSheet.ambiguous_statements
          : ['None flagged']
      },
    ];

    return (
      <div style={{ marginTop: '2rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '1rem'
        }}>
          <h2 style={{
            color: 'var(--text-primary)',
            fontSize: '1.2rem', fontWeight: 700
          }}>
            🔒 Source of Truth — Fact Sheet
          </h2>
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '0.8rem',
            color: '#4ade80',
            fontWeight: 600
          }}>
            Confidence: {((factSheet.confidence_score || 0) * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {sections.map((section, i) => (
            <div key={i} className="glass-card" style={{ padding: '1rem' }}>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.78rem', fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}>
                {section.title}
              </p>
              {Array.isArray(section.content) ? (
                <ul style={{
                  paddingLeft: '1rem', margin: 0,
                  display: 'flex', flexDirection: 'column', gap: '4px'
                }}>
                  {section.content.map((item, j) => (
                    <li key={j} style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.88rem', lineHeight: 1.5
                    }}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.88rem', lineHeight: 1.5, margin: 0
                }}>
                  {section.content}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Proceed Button */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={() => navigate('/review')}
            size="lg"
          >
            Continue to Copywriter Agent →
          </Button>
        </div>
      </div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid var(--border-accent)',
            borderRadius: '20px', padding: '0.3rem 1rem',
            marginBottom: '0.8rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
              AGENT ROOM
            </span>
          </div>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: 800,
            color: 'var(--text-primary)', marginBottom: '0.4rem'
          }}>
            Content Factory Pipeline
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Watch your AI agents collaborate in real time to build your campaign.
          </p>
        </div>

        {/* Agent Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <AgentCard
            name="Fact-Check Agent"
            role="Analytical Brain"
            description="Reads your source document and extracts a verified fact-sheet. This becomes the locked Source of Truth for all other agents."
            status={agent1Status}
            output={factSheet ? JSON.stringify(factSheet) : null}
          />
          <AgentCard
            name="Copywriter Agent"
            role="Creative Voice"
            description="Takes the fact-sheet and generates a blog post, social media thread, and email teaser — each with the right tone."
            status={agent2Status}
          />
          <AgentCard
            name="Editor Agent"
            role="Quality Gatekeeper"
            description="Checks all generated content against the fact-sheet for accuracy, tone, and quality. Sends corrections if needed."
            status={agent3Status}
          />
        </div>

        {/* Chat Feed */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            color: 'var(--text-secondary)', fontSize: '0.85rem',
            fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: '0.6rem'
          }}>
            📡 Live Agent Feed
          </h3>
          <ChatFeed messages={messages} />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem', color: '#f87171',
            fontSize: '0.9rem', marginBottom: '1.5rem'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Action Button */}
        {!factSheet && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isRunning ? (
              <Loader text="Agent 1 is analyzing your document..." />
            ) : (
              <>
                <Button onClick={runFactCheckAgent} size="lg" disabled={!campaignId}>
                  🔍 Run Fact-Check Agent
                </Button>
                <Button
                  onClick={() => navigate('/upload')}
                  variant="ghost"
                  size="lg"
                >
                  ← Back to Upload
                </Button>
              </>
            )}
          </div>
        )}

        {/* Fact Sheet Output */}
        {renderFactSheet()}
      </div>
    </div>
  );
};

export default AgentRoom;