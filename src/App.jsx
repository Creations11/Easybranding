// src/App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

import Nav from './components/Nav';
import SectionErrorBoundary from './components/SectionErrorBoundary';
import { colors } from './utils/theme';

// ── What the first download carries ─────────────────────────────────────
//
// Until 2026-10-05 every page was imported here, so the whole app shipped as
// one 796 KB file and somebody tapping the R99 ad on a phone on data
// downloaded every dashboard before seeing the landing page. Now the
// visitor's path (the landing page, sign in, sign up, the legal pages) is
// in the first file, and everything behind a login loads when it is opened.
import Home               from './pages/Home';
import { TermsOfUse, PrivacyPolicy, RefundPolicy, ContactPage, DataDeletion } from './pages/Legal';
import Login              from './pages/Login';
import Register           from './pages/Register';

// A page file can vanish under an open tab: every deploy renames them, so a
// tab opened before it asks for a file that no longer exists. One reload
// fetches the new names. A second failure inside ten seconds is a real fault,
// so it surfaces to the boundary below instead of reloading forever. If
// sessionStorage is blocked we cannot tell a first failure from a loop, so we
// do not reload at all.
const RELOAD_KEY = 'eb_page_reload_at';
const reloadedRecently = () => {
  try { return Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) || 0) < 10_000; }
  catch { return true; }
};
const markReload = () => {
  try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); return true; }
  catch { return false; }
};
const lazyPage = (load) => lazy(() => load().catch((err) => {
  if (!reloadedRecently() && markReload()) {
    window.location.reload();
    return new Promise(() => {}); // the reload replaces this page
  }
  throw err;
}));

const Dashboard           = lazyPage(() => import('./pages/Dashboard'));
const AdminDashboard      = lazyPage(() => import('./pages/AdminDashboard'));
const AgentDashboard      = lazyPage(() => import('./pages/AgentDashboard'));
const PendingApproval     = lazyPage(() => import('./pages/PendingApproval'));
const SuperAdminDashboard = lazyPage(() => import('./pages/SuperAdminDashboard'));
const Onboarding          = lazyPage(() => import('./pages/Onboarding'));
const Continue            = lazyPage(() => import('./pages/Continue'));
const Documentation       = lazyPage(() => import('./pages/Documentation'));
const Help                = lazyPage(() => import('./pages/Help'));

const PageLoading = () => (
  <div style={{
    minHeight: '100vh', background: colors.bg, color: colors.muted,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
  }}>Loading…</div>
);

// Keyed on the path, so leaving a page that failed clears the failure. A
// retry reloads rather than re-rendering: React keeps a lazy page's failed
// import, so rendering it again would only throw the same error.
function RouteBoundary({ children }) {
  const { pathname } = useLocation();
  return (
    <SectionErrorBoundary key={pathname} name="This page" onRetry={() => window.location.reload()}>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </SectionErrorBoundary>
  );
}

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

function ConditionalNav() {
  const location = useLocation();
  const showNav = PUBLIC_NAV_ROUTES.includes(location.pathname);
  if (!showNav) return null;
  return <Nav />;
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
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <ConditionalNav />
            <RouteBoundary>
            <Routes>
              {/* ── Public Routes ──────────────────────────────────── */}
              <Route path="/"         element={<PublicRoute><Home /></PublicRoute>} />
              <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register"       element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/terms"          element={<TermsOfUse />} />
              <Route path="/privacy"        element={<PrivacyPolicy />} />
              <Route path="/refund-policy"  element={<RefundPolicy />} />
              <Route path="/data-deletion"  element={<DataDeletion />} />
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

              {/* Deliberately PUBLIC and not wrapped in PublicRoute: the one-time
                  token is the credential, and a logged-in operator sending
                  themselves a test link must not be bounced to a dashboard. */}
              <Route path="/continue" element={<Continue />} />

              {/* ── Fallback ──────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </RouteBoundary>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}