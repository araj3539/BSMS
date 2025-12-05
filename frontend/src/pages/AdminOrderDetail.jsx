// src/pages/AdminOrderDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function AdminOrderDetail(){
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(()=> { fetchOrder(); }, [id]);

  async function fetchOrder(){
    setLoading(true);
    try{
      const r = await api.get('/orders/' + id);
      setOrder(r.data);
      setStatus(r.data.status);
    }catch(err){
      console.error(err);
      toast.error('Failed to load order');
    }finally{ setLoading(false); }
  }

  async function saveStatus(){
    if(!confirm(`Change status to ${status}?`)) return;
    try{
      const res = await api.put(`/orders/${id}/status`, { status });
      setOrder(res.data);
      toast.success('Status updated');
    }catch(err){
      toast.error(err.response?.data?.msg || 'Failed');
    }
  }

  if(loading) return <div className="flex justify-center p-20"><div className="loader"></div></div>;
  if(!order) return <div className="text-center p-20 text-slate-500">Order not found</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <button onClick={()=> nav('/admin/orders')} className="mb-4 text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
        &larr; Back to orders
      </button>
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
          Order #{order._id.slice(-6).toUpperCase()}
        </h2>
        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wide">
          {new Date(order.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* --- Left Column: Items & Customer --- */}
        <div className="flex-1 space-y-6">
          
          {/* Items Card */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Items Ordered</h4>
            <div className="space-y-4">
              {order.items.map(it => (
                <div key={it.bookId} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm md:text-base line-clamp-1">{it.title}</div>
                    <div className="text-xs text-slate-500 mt-1">Qty: {it.qty} • ₹{it.price}</div>
                  </div>
                  <div className="font-bold text-slate-900 text-sm md:text-base">₹{it.qty * it.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Customer Details</h4>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Name</p>
                <p className="font-medium text-slate-700">{order.userIdName || order.userId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Email</p>
                <p className="font-medium text-slate-700 break-all">{order.userEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Shipping Address</p>
                <p className="font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">{order.shippingAddress || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Right Column: Summary & Actions --- */}
        <aside className="lg:w-80 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4">Payment Summary</h4>
            <div className="space-y-2 text-sm text-slate-600 mb-4">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
              <div className="flex justify-between text-emerald-600"><span>Discount</span><span>- ₹{order.discount}</span></div>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg text-slate-900">
              <span>Total</span><span>₹{order.totalAmount}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4">Update Status</h4>
            <div className="space-y-4">
              <select 
                value={status} 
                onChange={e=> setStatus(e.target.value)} 
                className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button 
                onClick={saveStatus} 
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}