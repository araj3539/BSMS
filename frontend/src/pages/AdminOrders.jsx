// src/Pages/AdminOrders.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

export default function AdminOrders(){
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const nav = useNavigate();

  useEffect(()=> { 
    fetchOrders(); 
    const handleEsc = (e) => { if (e.key === 'Escape') setSelectedOrder(null); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  async function fetchOrders(){
    setLoading(true);
    try{
      const r = await api.get('/orders');
      setOrders(r.data);
    }catch(err){
      toast.error('Failed to load orders');
    }finally{ setLoading(false); }
  }

  function openStatusModal(order) {
    setSelectedOrder(order);
    setNewStatus(order.status);
  }

  async function updateStatus(){
    if(!selectedOrder) return;
    try{
      await api.put(`/orders/${selectedOrder._id}/status`, { status: newStatus });
      toast.success(`Order #${selectedOrder._id.slice(-6)} updated to ${newStatus}`);
      setSelectedOrder(null);
      fetchOrders();
    }catch(err){
      toast.error(err.response?.data?.msg || 'Failed to update');
    }
  }

  const filtered = orders.filter(o => !filter || o.status === filter);

  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">Orders</h2>
            <p className="text-slate-500 text-sm mt-1">Track and manage customer orders.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase px-3">Filter:</span>
            <select value={filter} onChange={e=> setFilter(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer pr-2">
                <option value="">All Orders</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={fetchOrders} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Refresh">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center p-10"><div className="loader"></div></div> : (
        <div className="space-y-4">
          {filtered.map(o => (
            <div key={o._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-slate-50 border border-slate-200`}>
                    <span className="text-2xl">📦</span>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">Order #{o._id.slice(-8).toUpperCase()}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                            {o.status}
                        </span>
                    </div>
                    <div className="text-sm text-slate-500">
                        <span className="font-medium text-slate-700">{o.userIdName || 'Unknown User'}</span> • {new Date(o.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        {o.items.length} Items • Total: <span className="font-bold text-slate-700">₹{o.totalAmount}</span>
                    </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pl-14 md:pl-0">
                <button 
                    onClick={()=> nav('/admin/orders/' + o._id)} 
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                >
                    View Details
                </button>
                <button 
                    onClick={()=> openStatusModal(o)} 
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-sm"
                >
                    Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- STATUS MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={()=>setSelectedOrder(null)}></div>
            
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-popIn">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-serif font-bold text-slate-900">Update Status</h3>
                    <p className="text-sm text-slate-500">Order #{selectedOrder._id.slice(-8).toUpperCase()}</p>
                </div>
                
                <div className="p-6 space-y-3">
                    {['pending','processing','shipped','delivered','cancelled'].map(status => (
                        <label key={status} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${newStatus === status ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="radio" 
                                    name="status" 
                                    value={status} 
                                    checked={newStatus === status} 
                                    onChange={e=> setNewStatus(e.target.value)}
                                    className="accent-indigo-600 w-4 h-4"
                                />
                                <span className="capitalize font-medium text-slate-700">{status}</span>
                            </div>
                            {newStatus === status && <span className="text-indigo-600 text-xs font-bold">Selected</span>}
                        </label>
                    ))}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={()=>setSelectedOrder(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
                    <button onClick={updateStatus} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md">
                        Update Order
                    </button>
                </div>
            </div>
        </div>
      )}

      <style>{`
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.95) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-popIn { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}