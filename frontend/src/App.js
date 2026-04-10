// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import UploadPage from './pages/UploadPage';
import AgentRoom from './pages/AgentRoom';
import Dashboard from './pages/Dashboard';
import FinalReview from './pages/FinalReview';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/upload" element={
            <ProtectedRoute><UploadPage /></ProtectedRoute>
          } />
          <Route path="/agent-room" element={
            <ProtectedRoute><AgentRoom /></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/review" element={
            <ProtectedRoute><FinalReview /></ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;