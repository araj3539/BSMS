// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if(!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.msg);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error sending email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow mt-10">
      <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
      <p className="text-gray-600 mb-4 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
      <form onSubmit={submit} className="space-y-3">
        <input 
          value={email} 
          onChange={e=> setEmail(e.target.value)} 
          placeholder="Enter your email" 
          className="w-full border p-2 rounded" 
          type="email"
        />
        <button 
          disabled={loading} 
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm text-blue-600 hover:underline">Back to Login</Link>
      </div>
    </div>
  );
}