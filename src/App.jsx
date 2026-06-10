// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

import Nav from './components/Nav';
import ChatModal from './components/ChatModal';

import Home               from './pages/Home';
import Login              from './pages/Login';
import Register           from './pages/Register';
import Dashboard          from './pages/Dashboard';
import AdminDashboard     from './pages/AdminDashboard';
import AgentDashboard     from './pages/AgentDashboard';
import PendingApproval    from './pages/PendingApproval';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
  catch { return {}; }
};

// ── Redirect logged-in users away from public pages ──────────
function PublicRoute({ children }) {
  const token = localStorage.getItem('eb_token');
  const user  = getUser();
  if (!token) return children;
  if (['super_admin', 'eb_manager', 'eb_agent'].includes(user.role)) return <Navigate to="/superadmin" replace />;
  if (user.role === 'admin')                              return <Navigate to="/admin"      replace />;
  if (user.role === 'agent')                              return <Navigate to="/agent"      replace />;
  if (user.role === 'borrower')                          return <Navigate to="/pending"    replace />;
  return <Navigate to="/dashboard" replace />;
}

// ── Protect routes ────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles = null }) {
  const token = localStorage.getItem('eb_token');
  const user  = getUser();

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (['super_admin', 'eb_manager', 'eb_agent'].includes(user.role)) return <Navigate to="/superadmin" replace />;
    if (user.role === 'admin')                              return <Navigate to="/admin"      replace />;
    if (user.role === 'agent')                              return <Navigate to="/agent"      replace />;
    if (user.role === 'borrower')                          return <Navigate to="/pending"    replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <Router>
      <Nav onChatOpen={() => setChatOpen(true)} />
      <Routes>
        {/* ── Public ── */}
        <Route path="/"         element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* ── Pending ── */}
        <Route path="/pending" element={
          <ProtectedRoute allowedRoles={['borrower']}>
            <PendingApproval />
          </ProtectedRoute>
        } />

        {/* ── Super Admin + EB Manager ── */}
        <Route path="/superadmin" element={
          <ProtectedRoute allowedRoles={['super_admin', 'eb_manager', 'eb_agent']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } />

        {/* ── Operations Center ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'eb_manager']}>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* ── Agent workspace ── */}
        <Route path="/agent" element={
          <ProtectedRoute allowedRoles={['agent', 'admin', 'super_admin', 'eb_agent', 'eb_manager']}>
            <AgentDashboard />
          </ProtectedRoute>
        } />

        {/* ── Admin — tenant admins only ── */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* ── Catch all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </Router>
  );
}