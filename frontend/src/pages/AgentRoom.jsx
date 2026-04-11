// frontend/src/pages/AgentRoom.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AgentCard from '../components/AgentCard';
import ChatFeed from '../components/ChatFeed';
import Button from '../components/Button';
import Loader from '../components/Loader';
import ContentPanel from '../components/ContentPanel';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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
  const [generatedContent, setGeneratedContent] = useState(null);

  // UI state
  const [messages, setMessages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('fact-check');
  const [error, setError] = useState('');
  const [campaignId, setCampaignId] = useState(null);
  const [campaignSource, setCampaignSource] = useState(null);

  const addMessage = useCallback((text, type = 'system') => {
    setMessages(prev => [...prev, { text, type, time: now() }]);
  }, []);

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
    addMessage(
      `Source: ${JSON.parse(source).filename || JSON.parse(source).source || 'Unknown'}`,
      'system'
    );
  }, [navigate, addMessage]);

  // ─── Agent 1: Fact-Check ─────────────────────────────────────────
  const runFactCheckAgent = async () => {
    if (!campaignId) return;

    setIsRunning(true);
    setError('');
    setAgent1Status('thinking');
    addMessage('Initializing Fact-Check Agent...', 'agent1');

    try {
      await new Promise(r => setTimeout(r, 800));
      setAgent1Status('working');
      addMessage('Reading source document and extracting facts...', 'agent1');
      await new Promise(r => setTimeout(r, 600));
      addMessage('Building structured fact-sheet...', 'agent1');

      const response = await axios.post(
        `http://localhost:5000/api/campaign/${campaignId}/fact-check`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = response.data;

      if (result.status === 'success') {
        setFactSheet(result.fact_sheet);
        setAgent1Status('done');
        setCurrentStep('copywrite');

        addMessage('Fact-sheet successfully generated ✅', 'success');
        addMessage(
          `Extracted: ${result.fact_sheet.core_features?.length || 0} features, ` +
          `${result.fact_sheet.target_audience?.length || 0} audience segments`,
          'agent1'
        );
        addMessage(
          `Confidence: ${((result.confidence_score || 0) * 100).toFixed(0)}% | ` +
          `Quality: ${result.source_quality || 'unknown'}`,
          'agent1'
        );

        if (result.has_warnings) {
          result.warnings.forEach(w => addMessage(w, 'warning'));
        }

        addMessage('Source of Truth locked 🔒 Ready for Copywriter Agent.', 'agent1');
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

  // ─── Agent 2: Copywriter ─────────────────────────────────────────
  const runCopywriterAgent = async () => {
    if (!campaignId) return;

    setIsRunning(true);
    setError('');
    setAgent2Status('thinking');
    addMessage('Initializing Copywriter Agent...', 'agent2');

    try {
      await new Promise(r => setTimeout(r, 800));
      setAgent2Status('working');
      addMessage('Reading locked fact-sheet as source of truth...', 'agent2');
      await new Promise(r => setTimeout(r, 500));
      addMessage('Generating 500-word blog post (Professional tone)...', 'agent2');
      await new Promise(r => setTimeout(r, 400));
      addMessage('Generating 5-post social media thread (Punchy tone)...', 'agent2');
      await new Promise(r => setTimeout(r, 400));
      addMessage('Generating email teaser (Formal tone)...', 'agent2');

      const response = await axios.post(
        `http://localhost:5000/api/campaign/${campaignId}/copywrite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = response.data;

      if (result.status === 'success') {
        setGeneratedContent(result);
        setAgent2Status('done');
        setCurrentStep('review');

        addMessage('All 3 content formats generated ✅', 'success');
        addMessage(
          `Blog: ${result.blog?.word_count || '~500'} words | ` +
          `Social: ${result.social?.posts?.length || 5} posts | ` +
          `Email: ${result.email?.word_count || '~100'} words`,
          'agent2'
        );

        if (result.has_warnings) {
          result.warnings.forEach(w => addMessage(w, 'warning'));
        }

        addMessage('Copywriter Agent complete. Ready for Editor review.', 'agent2');
      }
    } catch (err) {
      setAgent2Status('error');
      const msg = err.response?.data?.error || 'Copywriter agent failed';
      setError(msg);
      addMessage(`Error: ${msg}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  // ─── Regenerate Content ──────────────────────────────────────────
  const handleRegenerate = async () => {
    setGeneratedContent(null);
    setAgent2Status('idle');
    setCurrentStep('copywrite');
    addMessage('Regenerating content...', 'system');
    await runCopywriterAgent();
  };

  // ─── Render Fact Sheet ───────────────────────────────────────────
  const renderFactSheet = () => {
    if (!factSheet) return null;

    const sections = [
      { title: '🏷️ Product / Topic', content: factSheet.product_or_topic || 'N/A' },
      { title: '🏢 Company / Brand', content: factSheet.company_or_brand || 'N/A' },
      { title: '💡 Value Proposition', content: factSheet.value_proposition || 'N/A' },
      {
        title: '⚡ Core Features',
        content: factSheet.core_features?.length ? factSheet.core_features : ['None found']
      },
      {
        title: '🎯 Target Audience',
        content: factSheet.target_audience?.length ? factSheet.target_audience : ['None found']
      },
      {
        title: '📊 Key Statistics',
        content: factSheet.key_statistics?.length ? factSheet.key_statistics : ['None found']
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
            borderRadius: '20px', padding: '4px 14px',
            fontSize: '0.8rem', color: '#4ade80', fontWeight: 600
          }}>
            Confidence: {((factSheet.confidence_score || 0) * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {sections.map((section, i) => (
            <div key={i} className="glass-card" style={{ padding: '1rem' }}>
              <p style={{
                color: 'var(--text-muted)', fontSize: '0.78rem',
                fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em', marginBottom: '0.5rem'
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
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--accent-purple)',
              fontWeight: 600
            }}>
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

        {/* Progress Steps */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '0.5rem', marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'fact-check', label: '1. Fact-Check', done: !!factSheet },
            { id: 'copywrite', label: '2. Copywriter', done: !!generatedContent },
            { id: 'review', label: '3. Editor Review', done: false },
          ].map((step, i) => (
            <React.Fragment key={step.id}>
              <div style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: step.done
                  ? 'rgba(34,197,94,0.15)'
                  : currentStep === step.id
                    ? 'rgba(124,58,237,0.15)'
                    : 'var(--bg-secondary)',
                border: `1px solid ${step.done
                  ? 'rgba(34,197,94,0.3)'
                  : currentStep === step.id
                    ? 'var(--border-accent)'
                    : 'var(--border-subtle)'}`,
                color: step.done
                  ? '#4ade80'
                  : currentStep === step.id
                    ? 'var(--accent-purple)'
                    : 'var(--text-muted)'
              }}>
                {step.done ? '✅ ' : ''}{step.label}
              </div>
              {i < 2 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Agent Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem', marginBottom: '2rem'
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
            output={generatedContent ? 'Blog + Social + Email generated' : null}
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isRunning ? (
            <Loader text={
              agent1Status === 'working' || agent1Status === 'thinking'
                ? 'Agent 1 analyzing document...'
                : 'Agent 2 writing content...'
            } />
          ) : (
            <>
              {/* Step 1 button */}
              {!factSheet && (
                <Button onClick={runFactCheckAgent} size="lg" disabled={!campaignId}>
                  🔍 Run Fact-Check Agent
                </Button>
              )}

              {/* Step 2 button */}
              {factSheet && !generatedContent && (
                <Button onClick={runCopywriterAgent} size="lg" disabled={!campaignId}>
                  ✍️ Run Copywriter Agent
                </Button>
              )}

              {/* Step 3 button */}
              {generatedContent && (
                <Button
                  onClick={() => navigate('/review')}
                  size="lg"
                >
                  ✅ Proceed to Editor Review →
                </Button>
              )}

              <Button
                onClick={() => navigate('/upload')}
                variant="ghost" size="lg"
              >
                ← Back to Upload
              </Button>
            </>
          )}
        </div>

        {/* Fact Sheet Output */}
        {renderFactSheet()}

        {/* Generated Content Output */}
        {generatedContent && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{
              color: 'var(--text-primary)',
              fontSize: '1.2rem', fontWeight: 700,
              marginBottom: '1rem'
            }}>
              ✍️ Generated Content — Version {generatedContent.version}
            </h2>
            <ContentPanel
              blog={generatedContent.blog}
              social={generatedContent.social}
              email={generatedContent.email}
              onRegenerate={handleRegenerate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentRoom;