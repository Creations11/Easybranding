// src/context/auth.js
//
// The auth context object and the hook that reads it. Split out of
// AuthContext.jsx on 2026-10-05 so that file exports only its component:
// React's fast refresh can hot-swap a module that exports components and
// nothing else, and falls back to a full page reload for one that mixes in a
// hook (the react-refresh/only-export-components lint rule).
import { createContext, useContext } from 'react';
import api from '../api';

export const AuthContext = createContext(null);

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
          // Signing out locally must not depend on the server agreeing: an
          // expired session or no signal still has to get the person out.
          try { await api.post('/auth/logout'); } catch { /* signed out locally regardless */ }
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
