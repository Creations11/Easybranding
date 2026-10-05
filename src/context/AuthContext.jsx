// src/context/AuthContext.jsx
//
// The session provider. The context object and useAuth() live in ./auth.js,
// so this file exports only a component (see the note there).
import { useState, useCallback, useEffect } from 'react';
import api from '../api';
import { AuthContext } from './auth';

const readStoredUser = () => {
  try {
    const stored = localStorage.getItem('eb_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  // Only a stored session has anything to wait for: it is checked with the
  // server once, below. With no stored session there is nothing to verify,
  // so this starts false instead of starting true and being flipped off in
  // an effect a frame later.
  const [isLoading, setIsLoading] = useState(() => readStoredUser() !== null);

  // Once, on mount, for the session that was stored when the app opened.
  useEffect(() => {
    if (readStoredUser() === null) return;
    const verifyAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        const userData = res.data.data?.user || res.data.user;
        if (userData) {
          localStorage.setItem('eb_user', JSON.stringify(userData));
          setUser(userData);
        }
      } catch {
        localStorage.removeItem('eb_user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const signOut = useCallback(async () => {
    // Signing out locally must not depend on the server agreeing: an expired
    // session or no signal still has to get the person out.
    try {
      await api.post('/auth/logout');
    } catch { /* signed out locally regardless */ }
    localStorage.removeItem('eb_user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const signIn = useCallback((userData) => {
    localStorage.setItem('eb_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    isEBManager: user?.role === 'eb_manager',
    isEBAgent: user?.role === 'eb_agent',
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
