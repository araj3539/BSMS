// src/Pages/AdminOrders.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-200 text-yellow-800',
  processing: 'bg-blue-200 text-blue-800',
  shipped: 'bg-indigo-200 text-indigo-800',
  delivered: 'bg-green-200 text-green-800',
  cancelled: 'bg-red-200 text-red-800'
};

export default function AdminOrders(){
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const nav = useNavigate();
  

  useEffect(()=> { fetchOrders(); }, []);

  async function fetchOrders(){
    setLoading(true);
    try{
      const r = await api.get('/orders'); // admin route returns all orders
      setOrders(r.data);
    }catch(err){
      console.error(err);
      toast.error('Failed to load orders');
    }finally{ setLoading(false); }
  }

  function goto(id){ nav('/admin/orders/' + id); }

  async function quickStatus(id, status){
    if(!confirm(`Set order ${id} to ${status}?`)) return;
    try{
      await api.put(`/orders/${id}/status`, { status });
      fetchOrders();
    }catch(err){
      toast.error(err.response?.data?.msg || 'Failed to update');
    }
  }

  const filtered = orders.filter(o => !filter || o.status === filter);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Orders</h2>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm">Filter:</label>
        <select value={filter} onChange={e=> setFilter(e.target.value)} className="border p-2 rounded">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={fetchOrders} className="ml-auto px-3 py-1 bg-gray-100 rounded">Refresh</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {filtered.map(o => (
            <div key={o._id} className="bg-white p-3 rounded shadow flex items-center justify-between">
              <div>
                <div className="font-semibold">Order #{o._id}</div>
                <div className="text-sm text-gray-600">By: {o.userIdName || o.userId} • {new Date(o.createdAt).toLocaleString()}</div>
                <div className="text-sm mt-1">Items: {o.items.length} • Total: ₹{o.totalAmount || o.subtotal}</div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded text-sm ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>
                  {o.status}
                </div>
                <button onClick={()=> goto(o._id)} className="px-2 py-1 bg-gray-100 rounded">View</button>

                <div className="flex gap-1">
                  {['processing','shipped','delivered','cancelled'].map(s => (
                    <button key={s} onClick={()=> quickStatus(o._id, s)} className="px-2 py-1 text-xs bg-gray-50 rounded border">{s}</button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
