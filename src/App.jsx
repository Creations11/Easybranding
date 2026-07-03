// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async'; // ← ADD THIS IMPORT

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
    <HelmetProvider> {/* ← WRAP YOUR ENTIRE APP WITH HelmetProvider */}
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
    </HelmetProvider> // ← CLOSE THE HelmetProvider
  );
}