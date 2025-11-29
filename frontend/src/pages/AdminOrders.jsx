import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce'; // <--- Import Hook

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
  
  // Search & Filter State
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const debouncedQ = useDebounce(q, 500); // 500ms delay
  const nav = useNavigate();

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  // Fetch when params change
  useEffect(() => { 
    fetchOrders(); 
  }, [page, statusFilter, debouncedQ]);

  async function fetchOrders(){
    setLoading(true);
    try{
      const params = { page, limit, status: statusFilter, q: debouncedQ };
      const r = await api.get('/orders', { params });
      
      // Handle both formats (Admin gets object, User gets array - but this is Admin page)
      if (r.data.orders) {
        setOrders(r.data.orders);
        setTotal(r.data.total);
      } else {
        setOrders(r.data); // Fallback
      }
    } catch(err){
      toast.error('Failed to load orders');
    } finally { setLoading(false); }
  }

  function openStatusModal(order) {
    setSelectedOrder(order);
    setNewStatus(order.status);
  }

  async function updateStatus(){
    if(!selectedOrder) return;
    try{
      await api.put(`/orders/${selectedOrder._id}/status`, { status: newStatus });
      toast.success('Order updated');
      setSelectedOrder(null);
      fetchOrders();
    }catch(err){
      toast.error('Failed to update');
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">Orders</h2>
            <p className="text-slate-500 text-sm mt-1">Manage {total} orders.</p>
        </div>
        
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input 
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Search ID, Name, or Email..." 
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
            />
            
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                <select 
                  value={statusFilter} 
                  onChange={e=> { setStatusFilter(e.target.value); setPage(1); }} 
                  className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
                >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
        </div>
      </div>

      {loading ? <div className="flex justify-center p-10"><div className="loader"></div></div> : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-slate-50 border border-slate-200 hidden sm:block`}>
                    <span className="text-2xl">📦</span>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-slate-900">#{o._id.slice(-8).toUpperCase()}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                            {o.status}
                        </span>
                    </div>
                    <div className="text-sm text-slate-500">
                        <span className="font-medium text-slate-700">{o.userIdName || 'Unknown User'}</span> • {new Date(o.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        {o.userEmail} • ₹{o.totalAmount}
                    </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={()=> nav('/admin/orders/' + o._id)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:border-indigo-500 hover:text-indigo-600 transition-colors">Details</button>
                <button onClick={()=> openStatusModal(o)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-colors">Update</button>
              </div>
            </div>
          ))}
          
          {orders.length === 0 && <div className="text-center py-10 text-slate-500">No orders found.</div>}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm disabled:opacity-50">Prev</button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm disabled:opacity-50">Next</button>
        </div>
      )}

      {/* --- STATUS MODAL (Simplified) --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={()=>setSelectedOrder(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-popIn" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">Update Status</h3>
                <div className="space-y-2">
                    {['pending','processing','shipped','delivered','cancelled'].map(s => (
                        <button key={s} onClick={()=> setNewStatus(s)} className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium capitalize ${newStatus === s ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                            {s}
                        </button>
                    ))}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={()=>setSelectedOrder(null)} className="text-sm text-slate-500 hover:text-slate-800">Cancel</button>
                    <button onClick={updateStatus} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700">Save</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}