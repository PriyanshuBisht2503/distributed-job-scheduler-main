import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Shield, Key, UserPlus, Lock } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.post('/auth/signin', { username, password });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          id: response.data.id,
          username: response.data.username,
          role: response.data.role
        }));
        navigate('/');
      } else {
        await api.post('/auth/signup', { username, password, role: 'ROLE_USER' });
        setIsLogin(true);
        setError('Registration successful! Please log in.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full filter blur-[150px] opacity-25"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-[150px] opacity-25"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Distributed Job Scheduler
          </h1>
          <p className="text-slate-400 text-sm mt-1">Enterprise Queue Management Platform</p>
        </div>

        <div className="flex border-b border-slate-800 mb-6">
          <button
            className={`flex-1 pb-3 text-sm font-semibold transition ${isLogin ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400 hover:text-slate-300'}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            <span className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Sign In
            </span>
          </button>
          <button
            className={`flex-1 pb-3 text-sm font-semibold transition ${!isLogin ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400 hover:text-slate-300'}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            <span className="flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" /> Sign Up
            </span>
          </button>
        </div>

        {error && (
          <div className={`p-3 rounded-lg text-xs font-semibold mb-4 text-center border ${error.includes('successful') ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' : 'bg-rose-950/40 text-rose-400 border-rose-900/50'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <input
                type="text"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type="password"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? 'Processing...' : isLogin ? 'Authenticate' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
