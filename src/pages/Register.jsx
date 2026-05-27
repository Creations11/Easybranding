// src/pages/Register.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', form);
      localStorage.setItem('token', response.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="bg-[#111111] p-10 rounded-3xl w-full max-w-md">
        <h2 className="text-3xl font-display font-bold text-center mb-8">Create Account</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="text" placeholder="Full Name" className="w-full bg-[#1F1F1F] border border-white/10 rounded-2xl px-6 py-4" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <input type="email" placeholder="Email" className="w-full bg-[#1F1F1F] border border-white/10 rounded-2xl px-6 py-4" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input type="tel" placeholder="Phone" className="w-full bg-[#1F1F1F] border border-white/10 rounded-2xl px-6 py-4" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <input type="password" placeholder="Password" className="w-full bg-[#1F1F1F] border border-white/10 rounded-2xl px-6 py-4" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button type="submit" disabled={loading} className="w-full py-4 bg-lime-400 text-black rounded-2xl font-medium hover:bg-lime-300 transition">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;