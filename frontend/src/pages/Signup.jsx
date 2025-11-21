// src/pages/Signup.jsx
import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // 1. Import hook
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Signup(){
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();
  const { login } = useAuth(); // 2. Get login function

  async function submit(e){
    e.preventDefault();
    try{
      // 1. Register
      await api.post('/auth/signup', { name, email, password });
      
      // 2. Auto-Login immediately
      const res = await api.post('/auth/login', { email, password });
      
      // 3. Update Context
      login(res.data.token, res.data.user);
      
      toast.success('Account created! Welcome.');
      nav('/');
      // No reload needed
    }catch(err){
      toast.error(err.response?.data?.msg || 'Signup failed');
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Signup</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={e=> setName(e.target.value)} placeholder="Full name" className="w-full border p-2 rounded" />
        <input value={email} onChange={e=> setEmail(e.target.value)} placeholder="Email" className="w-full border p-2 rounded" />
        <input type="password" value={password} onChange={e=> setPassword(e.target.value)} placeholder="Password" className="w-full border p-2 rounded" />
        <button className="w-full bg-green-600 text-white py-2 rounded">Create account</button>
      </form>
    </div>
  );
}