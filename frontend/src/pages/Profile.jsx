// src/pages/Profile.jsx
import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile } = useAuth(); // use updateProfile from context
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  
  // Address Form State
  const [addrLabel, setAddrLabel] = useState('');
  const [addrText, setAddrText] = useState('');

  // 1. Update Profile Name
  async function handleProfileUpdate(e) {
    e.preventDefault();
    if (!name) return toast.error('Name cannot be empty');
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', { name });
      updateProfile(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  // 2. Add Address
  async function addAddress(e) {
    e.preventDefault();
    if(!addrLabel || !addrText) return toast.error('Fields required');
    try {
      const res = await api.post('/auth/address', { label: addrLabel, address: addrText });
      updateProfile(res.data.user);
      setAddrLabel('');
      setAddrText('');
      toast.success('Address added');
    } catch(err) {
      toast.error('Failed to add address');
    }
  }

  // 3. Delete Address
  async function deleteAddress(id) {
    if(!confirm('Delete this address?')) return;
    try {
      const res = await api.delete(`/auth/address/${id}`);
      updateProfile(res.data.user);
      toast.success('Address deleted');
    } catch(err) {
      toast.error('Failed to delete');
    }
  }

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
      {/* Left: Profile Details */}
      <div className="bg-white p-6 rounded shadow h-fit">
        <h2 className="text-xl font-semibold mb-4">My Profile</h2>
        <form onSubmit={handleProfileUpdate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input value={user?.email || ''} disabled className="w-full border p-2 rounded bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Right: Address Book */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Address Book</h2>
        
        {/* List Saved Addresses */}
        <div className="space-y-3 mb-6">
          {user?.addresses?.length === 0 && <p className="text-gray-500 text-sm">No saved addresses.</p>}
          {user?.addresses?.map(addr => (
            <div key={addr._id} className="border p-3 rounded flex justify-between items-start">
              <div>
                <span className="font-bold text-sm block">{addr.label}</span>
                <span className="text-sm text-gray-600">{addr.address}</span>
              </div>
              <button onClick={() => deleteAddress(addr._id)} className="text-red-500 text-xs hover:underline">
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Add New Address */}
        <form onSubmit={addAddress} className="border-t pt-4">
          <h4 className="font-medium mb-3 text-sm">Add New Address</h4>
          <div className="flex gap-2 mb-2">
            <input 
              value={addrLabel} 
              onChange={e => setAddrLabel(e.target.value)} 
              placeholder="Label (e.g. Home)" 
              className="border p-2 rounded w-1/3 text-sm" 
            />
            <input 
              value={addrText} 
              onChange={e => setAddrText(e.target.value)} 
              placeholder="Full Address" 
              className="border p-2 rounded flex-1 text-sm" 
            />
          </div>
          <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">Add</button>
        </form>
      </div>
    </div>
  );
}