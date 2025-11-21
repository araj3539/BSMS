// src/Pages/AdminOrderDetail.jsx
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

  if(loading) return <div>Loading...</div>;
  if(!order) return <div>Order not found</div>;

  return (
    <div>
      <button onClick={()=> nav('/admin/orders')} className="mb-3 text-sm text-blue-600">← Back to orders</button>
      <h2 className="text-xl font-semibold mb-3">Order #{order._id}</h2>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-4 rounded shadow">
          <h4 className="font-semibold mb-2">Items</h4>
          <div className="space-y-2">
            {order.items.map(it => (
              <div key={it.bookId} className="flex justify-between">
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-sm text-gray-600">Qty: {it.qty} • ₹{it.price}</div>
                </div>
                <div className="font-semibold">₹{it.qty * it.price}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <h4 className="font-semibold">Customer</h4>
            <div>{order.userIdName || order.userId}</div>
            <div className="text-sm text-gray-600">{order.userEmail || ''}</div>
            <div className="mt-2">Address: {order.shippingAddress || 'N/A'}</div>
          </div>
        </div>

        <aside className="bg-white p-4 rounded shadow">
          <h4 className="font-semibold mb-2">Summary</h4>
          <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>₹{order.discount}</span></div>
          <div className="border-t mt-2 pt-2 flex justify-between font-semibold"><span>Total</span><span>₹{order.totalAmount}</span></div>

          <div className="mt-4">
            <label className="block text-sm mb-1">Status</label>
            <select value={status} onChange={e=> setStatus(e.target.value)} className="border p-2 rounded w-full">
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="shipped">shipped</option>
              <option value="delivered">delivered</option>
              <option value="cancelled">cancelled</option>
            </select>
            <button onClick={saveStatus} className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded">Save</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
