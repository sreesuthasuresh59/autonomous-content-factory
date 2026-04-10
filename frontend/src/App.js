// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/global.css';

import UploadPage from './pages/UploadPage';
import AgentRoom from './pages/AgentRoom';
import Dashboard from './pages/Dashboard';
import FinalReview from './pages/FinalReview';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/agent-room" element={<AgentRoom />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/review" element={<FinalReview />} />
      </Routes>
    </Router>
  );
}

export default App;