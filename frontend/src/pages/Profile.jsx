import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  
  // Address Form State
  const [addrLabel, setAddrLabel] = useState('');
  const [addrText, setAddrText] = useState('');
  const [addingAddr, setAddingAddr] = useState(false);

  // --- ACTIONS ---

  async function handleProfileUpdate(e) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', { name });
      updateProfile(res.data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  async function addAddress(e) {
    e.preventDefault();
    if(!addrLabel || !addrText) return toast.error('Please fill in all fields');
    
    setAddingAddr(true);
    try {
      const res = await api.post('/auth/address', { label: addrLabel, address: addrText });
      updateProfile(res.data.user);
      setAddrLabel('');
      setAddrText('');
      toast.success('Address added to your book');
    } catch(err) {
      toast.error('Failed to add address');
    } finally {
      setAddingAddr(false);
    }
  }

  async function deleteAddress(id) {
    if(!confirm('Are you sure you want to remove this address?')) return;
    try {
      const res = await api.delete(`/auth/address/${id}`);
      updateProfile(res.data.user);
      toast.success('Address removed');
    } catch(err) {
      toast.error('Failed to delete address');
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- HEADER SECTION --- */}
      <div className="relative mb-12">
        {/* Decorative Background */}
        <div className="h-48 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl shadow-xl overflow-hidden relative">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* User Card */}
        <div className="absolute -bottom-12 left-8 md:left-12 flex items-end gap-6">
           <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white p-1.5 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="w-full h-full bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-bold text-indigo-600 border border-indigo-100">
                 {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
           </div>
           <div className="mb-3 hidden md:block">
              <h1 className="text-3xl font-serif font-bold text-white drop-shadow-md">{user?.name}</h1>
              <p className="text-indigo-100 font-medium text-sm">{user?.email}</p>
           </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT: PERSONAL INFO --- */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="font-serif text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span>👤</span> Personal Details
              </h2>
              
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    value={user?.email || ''} 
                    disabled 
                    className="w-full bg-slate-100 border border-transparent rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 pl-1">Email cannot be changed securely.</p>
                </div>
                
                <button 
                  disabled={loading} 
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-600 hover:shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {loading ? <div className="loader w-4 h-4 border-2 border-white/30 border-t-white"></div> : 'Save Changes'}
                </button>
              </form>
           </div>

           {/* Stats / Quick Info */}
           <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                 <span className="text-sm font-medium text-indigo-900">Member Since</span>
                 <span className="text-sm font-bold text-indigo-700">{new Date(user?.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="h-px bg-indigo-200 w-full"></div>
              <div className="flex items-center justify-between">
                 <span className="text-sm font-medium text-indigo-900">Account Type</span>
                 <span className="text-xs font-bold uppercase bg-white text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">{user?.role}</span>
              </div>
           </div>
        </div>

        {/* --- RIGHT: ADDRESS BOOK --- */}
        <div className="lg:col-span-2">
           <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 h-full">
              <div className="flex justify-between items-end mb-8">
                 <div>
                    <h2 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <span>📍</span> Address Book
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Manage your shipping destinations.</p>
                 </div>
                 <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{user?.addresses?.length || 0} Saved</span>
              </div>

              {/* Address List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 <AnimatePresence>
                   {user?.addresses?.map(addr => (
                     <motion.div 
                        key={addr._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all hover:shadow-md"
                     >
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-bold text-slate-800 text-sm bg-slate-100 px-2 py-1 rounded group-hover:bg-white transition-colors">{addr.label}</span>
                           <button 
                              onClick={() => deleteAddress(addr._id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                              title="Delete Address"
                           >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                           </button>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed pr-6">{addr.address}</p>
                     </motion.div>
                   ))}
                 </AnimatePresence>
                 
                 {(!user?.addresses || user.addresses.length === 0) && (
                    <div className="col-span-1 md:col-span-2 py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                       <span className="text-4xl mb-3 opacity-50">🗺️</span>
                       <p className="text-slate-500 font-medium">No addresses saved yet.</p>
                       <p className="text-xs text-slate-400 mt-1">Add one below for faster checkout.</p>
                    </div>
                 )}
              </div>

              {/* Add Address Form */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                 <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wide mb-4">Add New Address</h4>
                 <form onSubmit={addAddress} className="flex flex-col md:flex-row gap-3">
                    <div className="md:w-1/3">
                       <input 
                          value={addrLabel} 
                          onChange={e => setAddrLabel(e.target.value)} 
                          placeholder="Label (e.g. Home)" 
                          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                       />
                    </div>
                    <div className="flex-1">
                       <input 
                          value={addrText} 
                          onChange={e => setAddrText(e.target.value)} 
                          placeholder="Full Address (Street, City, Pincode)" 
                          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                       />
                    </div>
                    <button 
                       disabled={addingAddr}
                       className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-70 whitespace-nowrap"
                    >
                       {addingAddr ? 'Adding...' : 'Add Address'}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}