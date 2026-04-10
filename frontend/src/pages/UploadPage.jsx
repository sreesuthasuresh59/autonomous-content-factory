// frontend/src/pages/UploadPage.jsx

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';   // ✅ ADD THIS
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Loader from '../components/Loader';
import axios from 'axios';

const UploadPage = () => {
  const { token } = useAuth();   // ✅ ADD THIS

  const [activeTab, setActiveTab] = useState('file');
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
      setError(`❌ File type ".${ext}" is not supported.`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('❌ File too large (max 10MB)');
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

  // 🚀 IMPORTANT FUNCTION
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      let response;

      if (activeTab === 'file') {
        if (!selectedFile) {
          setError('Please select a file');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        response = await axios.post(
          'http://localhost:5000/api/campaign/upload',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`   // ✅ ADD THIS
            }
          }
        );

      } else {
        if (!url.trim()) {
          setError('Please enter URL');
          setLoading(false);
          return;
        }

        response = await axios.post(
          'http://localhost:5000/api/campaign/upload',
          { url },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`   // ✅ ADD THIS
            }
          }
        );
      }

      // ✅ SUCCESS HANDLING
      if (response.data.status === 'success') {
        localStorage.setItem('campaignSource', JSON.stringify(response.data));
        localStorage.setItem('campaign_id', response.data.campaign_id);  // ⭐ IMPORTANT
        navigate('/agent-room');
      }

    } catch (err) {
      setError(err.response?.data?.error || '❌ Backend error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h1>Upload Page</h1>
      </div>

      <div style={{ maxWidth: 600, margin: 'auto' }}>

        {/* FILE */}
        {activeTab === 'file' && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current.click()}
            style={{
              border: '2px dashed white',
              padding: '2rem',
              cursor: 'pointer'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {selectedFile ? selectedFile.name : 'Drop file here'}
          </div>
        )}

        {/* URL */}
        {activeTab === 'url' && (
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Enter URL"
            style={{ width: '100%', padding: '10px' }}
          />
        )}

        {/* ERROR */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* BUTTON */}
        {loading ? (
          <Loader />
        ) : (
          <Button onClick={handleSubmit}>
            Submit
          </Button>
        )}

      </div>
    </div>
  );
};

export default UploadPage;