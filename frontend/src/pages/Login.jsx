import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Login(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  async function submit(e){
    e.preventDefault();
    setLoading(true);
    try{
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      toast.success('Welcome back!');
      nav('/'); 
    }catch(err){
      toast.error(err.response?.data?.msg || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Please enter your details to sign in.</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                type="email"
                value={email} 
                onChange={e=> setEmail(e.target.value)} 
                className="w-full border border-slate-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="you@example.com" 
                required
              />
          </div>
          <div>
              <div className="flex justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link to="/forgot-password" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Forgot?</Link>
              </div>
              <input 
                type="password" 
                value={password} 
                onChange={e=> setPassword(e.target.value)} 
                className="w-full border border-slate-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••" 
                required
              />
          </div>
          
          <button 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-indigo-600 transition-all disabled:opacity-70 shadow-lg shadow-indigo-200"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
                Create account
            </Link>
        </div>
      </div>
    </div>
  );
}