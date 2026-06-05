// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

import Nav from './components/Nav';
import ChatModal from './components/ChatModal';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';

function ProtectedRoute({ children, requiredRole = null }) {
  const token = localStorage.getItem('eb_token');
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
    catch { return {}; }
  })();

  if (!token) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(user.role)) return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Redirect logged-in users away from public pages
function PublicRoute({ children }) {
  const token = localStorage.getItem('eb_token');
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('eb_user') || '{}'); }
    catch { return {}; }
  })();

  if (token) {
    // Redirect to appropriate dashboard based on role
    if (['admin', 'super_admin'].includes(user.role)) return <Navigate to="/admin" replace />;
    if (user.role === 'agent') return <Navigate to="/agent" replace />;
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
        {/* Public routes — redirect if logged in */}
        <Route path="/"         element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin"     element={<ProtectedRoute requiredRole={["admin", "super_admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/agent"     element={<ProtectedRoute requiredRole={["agent", "admin", "super_admin"]}><AgentDashboard /></ProtectedRoute>} />
      </Routes>
      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </Router>
  );
}