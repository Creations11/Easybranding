import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

import Nav from './components/Nav';
import ChatModal from './components/ChatModal';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children }) {
  return localStorage.getItem('eb_token') ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <Router>
      <Nav onChatOpen={() => setChatOpen(true)} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      </Routes>

      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </Router>
  );
}