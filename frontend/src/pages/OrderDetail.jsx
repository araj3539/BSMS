import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { fetchOrder(); }, [id]);

  function fetchOrder() {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }

  async function downloadInvoice() {
    setDownloading(true);
    try {
      const res = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  }

  async function handleCancel() {
    if(!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    
    setCancelling(true);
    try {
      await api.put(`/orders/${id}/cancel`);
      toast.success('Order cancelled successfully');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-4 w-24 bg-slate-200 rounded"></div>
        <div className="h-8 w-48 bg-slate-200 rounded"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
        <div className="space-y-4">
            <div className="h-32 bg-slate-200 rounded-xl"></div>
            <div className="h-32 bg-slate-200 rounded-xl"></div>
        </div>
    </div>
  );

  if (!order) return <div className="text-center p-20 text-slate-500">Order not found</div>;

  const steps = ['pending', 'processing', 'shipped', 'delivered'];
  const currentStep = steps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const formatMoney = (amount) => Number(amount || 0).toFixed(2);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24">
      {/* Back Link */}
      <Link to="/my-orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-6">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Back to Orders
      </Link>
      
      {/* Main Order Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        
        {/* Header Section */}
        <div className="p-5 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col gap-1 mb-6">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
              Order #{order._id.slice(-6).toUpperCase()}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>

          {/* Quick Stats Row */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-indigo-600">₹{formatMoney(order.totalAmount)}</p>
            </div>
            
            <button 
                onClick={downloadInvoice}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-50 shadow-sm"
            >
                {downloading ? (
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-indigo-600 rounded-full animate-spin"></div>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                )}
                {downloading ? 'Downloading...' : 'Invoice'}
            </button>
          </div>
        </div>

        {/* Status Section */}
        <div className="p-5 md:p-8">
            {isCancelled ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-red-100 shadow-sm text-lg">✕</div>
                    <div>
                        <p className="font-bold text-sm">Order Cancelled</p>
                        <p className="text-xs opacity-80">This order was cancelled.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-lg shadow-sm border border-indigo-200">
                        {currentStep >= 3 ? '🏡' : currentStep >= 2 ? '🚚' : currentStep >= 1 ? '⚙️' : '🕒'}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Current Status</p>
                        <p className="text-lg font-bold text-slate-900 capitalize">{order.status.replace('_', ' ')}</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6">
        
        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
                <h3 className="font-serif font-bold text-lg text-slate-800">Order Items</h3>
            </div>
            <div className="divide-y divide-slate-50">
                {order.items.map((item, i) => (
                    <div key={i} className="p-4 flex gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="w-12 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                            📖
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm md:text-base leading-tight mb-1">{item.title}</p>
                            <p className="text-xs text-slate-500 font-medium">Qty: {item.qty} × ₹{formatMoney(item.price)}</p>
                        </div>
                        <div className="font-bold text-slate-900 text-sm md:text-base text-right">
                            ₹{formatMoney(item.price * item.qty)}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 space-y-3">
            <h3 className="font-serif font-bold text-lg text-slate-800 mb-2">Payment Summary</h3>
            <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium">₹{formatMoney(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount Applied</span>
                    <span className="font-bold">- ₹{formatMoney(order.discount)}</span>
                </div>
            )}
            <div className="h-px bg-slate-100 my-2"></div>
            <div className="flex justify-between text-base md:text-lg font-bold text-slate-900">
                <span>Grand Total</span>
                <span>₹{formatMoney(order.totalAmount)}</span>
            </div>
        </div>

        {/* Shipping & Payment Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
            
            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
                <h3 className="font-serif font-bold text-lg text-slate-800 mb-4">Shipping Details</h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed break-words whitespace-pre-wrap">
                        {order.shippingAddress ? order.shippingAddress.trim() : 'No address provided'}
                    </p>
                </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
                <h3 className="font-serif font-bold text-lg text-slate-800 mb-4">Payment Info</h3>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Payment ID</p>
                        <p className="text-xs font-mono text-slate-700 break-all select-all">
                            {order.paymentId || 'N/A'}
                        </p>
                    </div>
                    {isCancelled ? (
                       <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-2 rounded-lg justify-center border border-red-100">
                         <span>⚠️</span> Order Cancelled
                       </div>
                    ) : (
                       <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 p-2 rounded-lg justify-center border border-emerald-100">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                         Payment Successful
                       </div>
                    )}
                </div>
            </div>
        </div>

        {/* Cancel Action */}
        {order.status === 'pending' && (
            <div className="mt-4">
                <button 
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full bg-white border-2 border-red-100 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
                >
                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
                <p className="text-xs text-center text-slate-400 mt-2">You can only cancel orders while they are pending.</p>
            </div>
        )}

      </div>
    </div>
  );
}