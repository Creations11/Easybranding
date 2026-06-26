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
// UPDATED (26 June 2026):
// Added Documentation, Onboarding, and Help pages to support
// user education and onboarding flow.
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

// ── New Documentation & Onboarding Pages ────────────────────
import Documentation from './pages/Documentation';
import Onboarding from './pages/Onboarding';
import Help from './pages/Help';

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
// Authenticated dashboard routes (/superadmin, /dashboard, /admin,
// /agent, /pending) are deliberately excluded — those pages render
// their own header/sidebar and should never show the public nav.
const PUBLIC_NAV_ROUTES = [
  '/',
  '/login',
  '/register',
  '/terms',
  '/privacy',
  '/refund-policy',
  '/contact',
  '/documentation',
  '/onboarding',
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
            <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* ── Legal Pages ───────────────────────────────────── */}
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* ── Documentation & Help ──────────────────────────── */}
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/help" element={<Help />} />

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

            {/* ── Fallback ──────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}