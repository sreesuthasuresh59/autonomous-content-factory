// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('cf_user');
    const savedToken = localStorage.getItem('cf_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('cf_user', JSON.stringify(userData));
    localStorage.setItem('cf_token', accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cf_user');
    localStorage.removeItem('cf_token');
    localStorage.removeItem('campaignSource');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);