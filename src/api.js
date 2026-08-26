// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Endpoints where a 401 is an ANSWER, not an expired session.
//
// /auth/handoff returns 401 for a spent or expired one-time link, and
// /auth/login returns it for a wrong password. Redirecting those to the
// login page throws away the only useful information the caller had.
//
// This cost a real customer: NovaCare opened their connect link, the token
// had already been consumed, and instead of "that link has expired, ask us
// for a new one" they were bounced to a password prompt for an account
// whose password they have never had. The page handled the failure
// correctly; the interceptor never let it.
const AUTH_ENDPOINTS = ['/auth/handoff', '/auth/login'];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthAttempt = AUTH_ENDPOINTS.some((p) => url.includes(p));

    // A 401 anywhere else genuinely means the session is gone, and sending
    // them to sign in again is right.
    if (err.response?.status === 401 && !isAuthAttempt) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;