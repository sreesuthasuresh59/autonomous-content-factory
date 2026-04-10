// frontend/src/pages/UploadPage.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Loader from '../components/Loader';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const UploadPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'url'
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const ALLOWED = ['pdf', 'txt', 'md', 'docx'];

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setError(`❌ File type ".${ext}" is not supported. Use PDF, TXT, MD, or DOCX.`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('❌ File is too large. Maximum size is 10MB.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) setSelectedFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) setSelectedFile(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      let response;

      if (activeTab === 'file') {
        if (!selectedFile) { setError('Please select a file first.'); setLoading(false); return; }
        const formData = new FormData();
        formData.append('file', selectedFile);
        response = await axios.post('http://localhost:5000/api/campaign/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        if (!url.trim()) { setError('Please enter a URL first.'); setLoading(false); return; }
        response = await axios.post('http://localhost:5000/api/campaign/upload',
          { url },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
      }

      if (response.data.status === 'success') {
        // Store data and navigate to agent room
        localStorage.setItem('campaignSource', JSON.stringify(response.data));
        localStorage.setItem('campaign_id', response.data.campaign_id);
        navigate('/agent-room');
      }
    } catch (err) {
      setError(err.response?.data?.error || '❌ Something went wrong. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '4rem 1rem 2rem' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(124,58,237,0.15)',
          border: '1px solid var(--border-accent)',
          borderRadius: '20px', padding: '0.4rem 1.2rem',
          marginBottom: '1.5rem'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
            ⚡ AI-POWERED
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            3-Agent Content Pipeline
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 800, lineHeight: 1.2,
          marginBottom: '1rem', maxWidth: 700, margin: '0 auto 1rem'
        }}>
          Transform Any Document Into a{' '}
          <span style={{
            background: 'var(--gradient-main)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Full Campaign
          </span>
        </h1>

        <p style={{
          color: 'var(--text-secondary)', fontSize: '1.1rem',
          maxWidth: 520, margin: '0 auto 3rem', lineHeight: 1.6
        }}>
          Upload a document or paste a URL. Our AI agents will research,
          write, and review your entire marketing campaign automatically.
        </p>
      </div>

      {/* Upload Card */}
      <div style={{
        maxWidth: 640, margin: '0 auto', padding: '0 1.5rem 4rem'
      }}>
        <div className="glass-card" style={{ padding: '2rem' }}>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '0.5rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px', marginBottom: '1.8rem'
          }}>
            {['file', 'url'].map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setError(''); }}
                style={{
                  flex: 1, padding: '0.6rem',
                  borderRadius: '6px', border: 'none',
                  background: activeTab === tab ? 'var(--gradient-main)' : 'transparent',
                  color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}>
                {tab === 'file' ? '📄 Upload File' : '🔗 Paste URL'}
              </button>
            ))}
          </div>

          {/* File Upload Area */}
          {activeTab === 'file' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent-purple)' : selectedFile ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '3rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'rgba(124,58,237,0.07)' : 'transparent',
                transition: 'all 0.2s'
              }}>
              <input ref={fileInputRef} type="file"
                accept=".pdf,.txt,.md,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }} />

              {selectedFile ? (
                <>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>✅</div>
                  <p style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{selectedFile.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB — Click to change
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>📂</div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    Drop your file here
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                    PDF, TXT, MD, DOCX — Max 10MB
                  </p>
                </>
              )}
            </div>
          )}

          {/* URL Input Area */}
          {activeTab === 'url' && (
            <div>
              <label style={{
                display: 'block', color: 'var(--text-secondary)',
                fontSize: '0.9rem', marginBottom: '0.6rem', fontWeight: 500
              }}>
                Article or Product Page URL
              </label>
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setError(''); }}
                placeholder="https://example.com/product-launch"
                style={{
                  width: '100%', padding: '0.9rem 1.1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem', outline: 'none',
                  fontFamily: 'var(--font-main)',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
              />
              <p style={{
                color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem'
              }}>
                We'll extract the content from this page automatically
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.8rem 1rem',
              color: '#f87171',
              fontSize: '0.9rem',
              marginTop: '1rem'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div style={{ marginTop: '1.5rem' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                <Loader text="Sending to agents..." />
              </div>
            ) : (
              <Button onClick={handleSubmit} fullWidth size="lg">
                ⚡ Launch Content Factory
              </Button>
            )}
          </div>
        </div>

        {/* Feature Pills */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap'
        }}>
          {[
            ' Fact-Check Agent',
            ' Copywriter Agent',
            ' Editor Agent'
          ].map(pill => (
            <span key={pill} style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '0.4rem 1rem',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)'
            }}>
              {pill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;