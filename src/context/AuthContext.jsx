// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────
// Auth context — single source of truth for user/token
// Safe to import anywhere — has localStorage fallback
// ─────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

  const [token, setToken] = useState(() => localStorage.getItem('eb_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Validate token on mount — expired token = sign out
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          console.warn('Token expired, signing out');
          signOut();
          return;
        }
      } catch (err) {
        console.warn('Invalid token, signing out');
        signOut();
        return;
      }
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const signOut = useCallback(() => {
    localStorage.removeItem('eb_token');
    localStorage.removeItem('eb_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const signIn = useCallback((newToken, userData) => {
    localStorage.setItem('eb_token', newToken);
    localStorage.setItem('eb_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!(token && user),
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

// ── Hook with safe fallback ──────────────────────────────────
// If used outside AuthProvider, falls back to localStorage
// This prevents crashes when importing in existing code
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    // Safe fallback for code that hasn't been wrapped yet
    if (typeof window === 'undefined') {
      return {
        user: null,
        token: null,
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
      const storedToken = localStorage.getItem('eb_token');
      const user = storedUser ? JSON.parse(storedUser) : null;

      // Check expiry
      if (storedToken && user) {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('eb_token');
            localStorage.removeItem('eb_user');
            window.location.href = '/login';
            return { isAuthenticated: false, isLoading: false };
          }
        } catch {
          // Invalid token format — continue with what we have
        }
      }

      return {
        user,
        token: storedToken,
        isLoading: false,
        isAuthenticated: !!(storedToken && user),
        isSuperAdmin: user?.role === 'super_admin',
        isEBManager: user?.role === 'eb_manager',
        isEBAgent: user?.role === 'eb_agent',
        signIn: (newToken, userData) => {
          localStorage.setItem('eb_token', newToken);
          localStorage.setItem('eb_user', JSON.stringify(userData));
        },
        signOut: () => {
          localStorage.removeItem('eb_token');
          localStorage.removeItem('eb_user');
          window.location.href = '/login';
        },
      };
    } catch {
      return {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        isSuperAdmin: false,
        isEBManager: false,
        isEBAgent: false,
        signIn: () => {},
        signOut: () => {},
      };
    }
  }

  return context;
}