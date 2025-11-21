// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if(password !== confirm) return toast.error('Passwords do not match');
    if(password.length < 6) return toast.error('Password must be at least 6 chars');
    
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      toast.success('Password reset successful! Please login.');
      nav('/login');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow mt-10">
      <h2 className="text-xl font-semibold mb-4">Set New Password</h2>
      <form onSubmit={submit} className="space-y-3">
        <input 
          type="password"
          value={password} 
          onChange={e=> setPassword(e.target.value)} 
          placeholder="New Password" 
          className="w-full border p-2 rounded" 
        />
        <input 
          type="password"
          value={confirm} 
          onChange={e=> setConfirm(e.target.value)} 
          placeholder="Confirm Password" 
          className="w-full border p-2 rounded" 
        />
        <button 
          disabled={loading} 
          className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}