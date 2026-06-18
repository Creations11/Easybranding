// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('eb_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    if (user) {
      verifyAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    if (typeof window === 'undefined') {
      return {
        user: null,
        isLoading: true,
        isAuthenticated: false,
        isSuperAdmin: false,
        isEBManager: false,
        isEBAgent: false,
        signIn: () => {},
        signOut: () => {},
      };
    }

    try {
      const storedUser = localStorage.getItem('eb_user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      return {
        user,
        isLoading: false,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'super_admin',
        isEBManager: user?.role === 'eb_manager',
        isEBAgent: user?.role === 'eb_agent',
        signIn: (userData) => {
          localStorage.setItem('eb_user', JSON.stringify(userData));
        },
        signOut: async () => {
          try { await api.post('/auth/logout'); } catch {}
          localStorage.removeItem('eb_user');
          window.location.href = '/login';
        },
      };
    } catch {
      return {
        user: null, isLoading: false, isAuthenticated: false,
        isSuperAdmin: false, isEBManager: false, isEBAgent: false,
        signIn: () => {}, signOut: () => {},
      };
    }
  }
  return context;
}