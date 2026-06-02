import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  return localStorage.getItem('eb_token') ? children : <Navigate to="/login" replace />;
}