import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  payment_pending: 'bg-slate-100 text-slate-600 border-slate-200'
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get("/orders")
      .then((res) => { setOrders(res.data); setFilteredOrders(res.data); })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let res = orders;
    if (statusFilter !== 'all') res = res.filter(o => o.status === statusFilter);
    if (search) {
        const lower = search.toLowerCase();
        res = res.filter(o => o._id.includes(lower) || o.items.some(i => i.title.toLowerCase().includes(lower)));
    }
    setFilteredOrders(res);
  }, [statusFilter, search, orders]);

  if (loading) return <div className="flex justify-center p-20"><div className="loader"></div></div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
        <div>
            <h2 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">My Orders</h2>
            <p className="text-slate-500 mt-2 font-medium">Track your purchase history</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <input 
                    placeholder="Search Order ID..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            </div>
            <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
            </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-24 bg-white/60 rounded-3xl border border-dashed border-slate-300">
            <p className="text-slate-500 text-lg font-medium">No orders found.</p>
            <button onClick={() => {setStatusFilter('all'); setSearch('')}} className="text-indigo-600 font-bold mt-2 hover:underline">Clear Filters</button>
        </div>
      ) : (
        <div className="space-y-6">
            <AnimatePresence>
            {filteredOrders.map((order) => (
            <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={order._id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group"
            >
                {/* Header */}
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                            <span className="font-mono font-bold text-slate-800 tracking-wider">#{order._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                            {order.status.replace('_', ' ')}
                        </span>
                        <Link to={`/order/${order._id}`} className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                            View Details &rarr;
                        </Link>
                    </div>
                </div>

                {/* Items */}
                <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 space-y-3 w-full">
                        {order.items.slice(0, 2).map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400 font-bold">x{item.qty}</span>
                                    <span className="text-slate-700 font-medium truncate max-w-[200px] md:max-w-xs">{item.title}</span>
                                </div>
                                <span className="text-slate-900 font-bold">₹{item.price * item.qty}</span>
                            </div>
                        ))}
                        {order.items.length > 2 && (
                            <p className="text-xs text-slate-400 font-medium pl-8">+ {order.items.length - 2} more items</p>
                        )}
                    </div>
                    
                    <div className="w-full md:w-auto text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Total Amount</p>
                        <p className="text-2xl font-serif font-bold text-slate-900">₹{order.totalAmount}</p>
                    </div>
                </div>
            </motion.div>
            ))}
            </AnimatePresence>
        </div>
      )}
    </div>
  );
}