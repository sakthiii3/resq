import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Hit actual API to get JWT token
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token);
        
        // Route based on role
        if (res.data.data.user.role === 'VOLUNTEER') {
          navigate('/volunteer');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 opacity-[0.03]"
           style={{
             backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }} />

      <form onSubmit={handleLogin} className="z-10 w-full max-w-sm glass-card p-8 rounded-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-[#cc0033]"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-primary to-rose-700 rounded-2xl shadow-lg shadow-primary/30 mb-4">
            <ShieldAlert size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">ResQ <span className="text-primary">Login</span></h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Authorized Personnel Only</p>
        </div>

        {error && <div className="text-red-400 text-xs mb-4 text-center">{error}</div>}

        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              placeholder="organizer@resq.in" 
              className="w-full px-4 py-3 bg-secondary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary transition-colors placeholder-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full px-4 py-3 bg-secondary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-primary transition-colors placeholder-slate-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-primary to-[#cc0033] text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center space-x-2 group">
            <Lock size={16} className="text-rose-200" />
            <span>Secure Login</span>
            <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
}
