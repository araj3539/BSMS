import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get("/orders")
      .then((res) => {
        setOrders(res.data);
        setFilteredOrders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching orders", err);
        setLoading(false);
      });
  }, []);

  // Handle Filtering logic
  useEffect(() => {
    let result = orders;

    // 1. Status Filter
    if (statusFilter !== 'all') {
        result = result.filter(o => o.status === statusFilter);
    }

    // 2. Search Filter (Order ID or Book Title)
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(o => 
            o._id.includes(lowerTerm) || 
            o.items.some(i => i.title.toLowerCase().includes(lowerTerm))
        );
    }

    setFilteredOrders(result);
  }, [statusFilter, searchTerm, orders]);

  if (loading) return <div className="flex justify-center p-10"><div className="loader"></div></div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">My Orders</h2>
            <p className="text-slate-500 mt-1">Track and manage your recent purchases</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input 
                placeholder="Search Order ID or Book..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-w-[200px]"
            />
            <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
            >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
            </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">No orders found matching your criteria.</p>
            <button onClick={() => {setStatusFilter('all'); setSearchTerm('')}} className="text-indigo-600 text-sm font-medium mt-2 hover:underline">Clear Filters</button>
        </div>
      ) : (
        <div className="space-y-6">
            {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-shadow hover:shadow-md">
                
                {/* Order Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Order Placed</p>
                            <p className="text-sm font-medium text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Order #</p>
                            <p className="text-sm font-medium text-slate-900">{order._id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            order.status === 'shipped' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-amber-100 text-amber-700'
                        }`}>
                            {order.status}
                        </span>
                        <Link to={`/order/${order._id}`} className="text-indigo-600 text-sm font-semibold hover:underline">
                            View Details
                        </Link>
                    </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                    <div className="space-y-3">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 bg-slate-100 rounded flex items-center justify-center text-lg">📚</div>
                                    <div>
                                        <p className="font-medium text-slate-800">{item.title}</p>
                                        <p className="text-xs text-slate-500">Qty: {item.qty}</p>
                                    </div>
                                </div>
                                <p className="font-medium text-slate-900">₹{item.price * item.qty}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                        <p className="text-lg font-bold text-slate-900">Total: ₹{order.totalAmount}</p>
                    </div>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
}