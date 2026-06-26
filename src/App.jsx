// src/App.jsx
//
// FIX APPLIED (23 June 2026):
// <Nav /> was mounted directly inside <Router>, outside of <Routes>,
// so it rendered unconditionally on EVERY route — including
// /superadmin, /dashboard, /admin, and /agent, which all already
// have their own complete header/sidebar built into their page
// components. This caused the public marketing navbar ("Sign In" /
// "Get Started" / leaf logo) to visibly float on top of the
// authenticated dashboard, even when already logged in. Fixed by
// only rendering <Nav /> when the current route is one of the
// public-facing pages, using React Router's useLocation hook.
//
// FIX APPLIED (26 June 2026):
// An intermediate version of this file made /onboarding fully
// public (no auth guard, listed in the public nav). Investigation
// found this was unsafe: Onboarding.jsx posts directly to /tenants,
// which requires req.user.id and an "admin" role to succeed
// (verifyAdmin middleware in server.js) — a real anonymous visitor
// could never successfully use it, and the existing Register.jsx
// flow has no path that grants a new signup the "admin" role needed
// to create a tenant. Confirmed directly: clients cannot register
// on the frontend at all. /onboarding is an internal tool for
// already-authenticated admins setting up a new business — reverted
// to a protected route and removed from the public nav list.
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

import Nav from './components/Nav';
import ChatModal from './components/ChatModal';

import Home               from './pages/Home';
import { TermsOfUse, PrivacyPolicy, RefundPolicy, ContactPage } from './pages/Legal';
import Login              from './pages/Login';
import Register           from './pages/Register';
import Dashboard          from './pages/Dashboard';
import AdminDashboard     from './pages/AdminDashboard';
import AgentDashboard     from './pages/AgentDashboard';
import PendingApproval    from './pages/PendingApproval';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Onboarding         from './pages/Onboarding';
import Documentation      from './pages/Documentation';
import Help               from './pages/Help';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
  catch { return {}; }
};

function PublicRoute({ children }) {
  const user = getUser();

  if (!user.role) return children;
  if (['super_admin', 'eb_manager', 'eb_agent'].includes(user.role)) return <Navigate to="/superadmin" replace />;
  if (user.role === 'admin')    return <Navigate to="/admin"    replace />;
  if (user.role === 'agent')    return <Navigate to="/agent"    replace />;
  if (user.role === 'borrower') return <Navigate to="/pending"  replace />;
  return <Navigate to="/dashboard" replace />;
}

function ProtectedRoute({ children, allowedRoles = null }) {
  const user = getUser();

  if (!user.role) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (['super_admin', 'eb_manager', 'eb_agent'].includes(user.role)) return <Navigate to="/superadmin" replace />;
    if (user.role === 'admin')    return <Navigate to="/admin"    replace />;
    if (user.role === 'agent')    return <Navigate to="/agent"    replace />;
    if (user.role === 'borrower') return <Navigate to="/pending"  replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ── Public Nav Routes ─────────────────────────────────────────
// Routes that should show the public marketing navbar.
// Authenticated/internal routes (/superadmin, /dashboard, /admin,
// /agent, /pending, /onboarding) are deliberately excluded — those
// pages render their own header/sidebar (or, for /onboarding,
// shouldn't be reachable by the public at all) and should never
// show the public nav. Documentation and Help ARE public-facing
// content pages, so they keep the public nav.
const PUBLIC_NAV_ROUTES = [
  '/',
  '/login',
  '/register',
  '/terms',
  '/privacy',
  '/refund-policy',
  '/contact',
  '/documentation',
  '/help',
];

function ConditionalNav({ onChatOpen }) {
  const location = useLocation();
  const showNav = PUBLIC_NAV_ROUTES.includes(location.pathname);
  if (!showNav) return null;
  return <Nav onChatOpen={onChatOpen} />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 2,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ConditionalNav onChatOpen={() => setChatOpen(true)} />
          <Routes>
            {/* ── Public Routes ──────────────────────────────────── */}
            <Route path="/"         element={<PublicRoute><Home /></PublicRoute>} />
            <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register"       element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/terms"          element={<TermsOfUse />} />
            <Route path="/privacy"        element={<PrivacyPolicy />} />
            <Route path="/refund-policy"  element={<RefundPolicy />} />
            <Route path="/contact"        element={<ContactPage />} />

            {/* ── Public Documentation & Help ───────────────────── */}
            <Route path="/documentation"  element={<Documentation />} />
            <Route path="/help"           element={<Help />} />

            {/* ── Protected Routes ──────────────────────────────── */}
            <Route path="/pending" element={
              <ProtectedRoute allowedRoles={['borrower']}>
                <PendingApproval />
              </ProtectedRoute>
            } />

            <Route path="/superadmin" element={
              <ProtectedRoute allowedRoles={['super_admin', 'eb_manager', 'eb_agent']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['super_admin', 'admin', 'eb_manager']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/agent" element={
              <ProtectedRoute allowedRoles={['agent', 'admin', 'super_admin', 'eb_agent', 'eb_manager']}>
                <AgentDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* /onboarding creates a real Tenant via POST /tenants,
                which requires an authenticated admin (verifyAdmin on
                the backend). Gated the same way as /admin — never
                public. */}
            <Route path="/onboarding" element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'eb_manager']}>
                <Onboarding />
              </ProtectedRoute>
            } />

            {/* ── Fallback ──────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}