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
    // --- ORDER DETAIL SKELETON ---
    <div className="max-w-5xl mx-auto px-6 py-10 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded mb-6"></div>
        <div className="bg-white rounded-2xl border border-slate-200 h-64 mb-8"></div>
        <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2 h-96 bg-slate-100 rounded-2xl"></div>
            <div className="h-96 bg-slate-100 rounded-2xl"></div>
        </div>
    </div>
  );

  if (!order) return <div className="text-center p-20 text-slate-500">Order not found</div>;

  const steps = ['pending', 'processing', 'shipped', 'delivered'];
  const currentStep = steps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const formatMoney = (amount) => Number(amount || 0).toFixed(2);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link to="/my-orders" className="text-slate-500 hover:text-slate-900 font-medium mb-6 inline-flex items-center gap-2 transition-colors">
        &larr; Back to Orders
      </Link>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* HEADER */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">Order #{order._id.slice(-8).toUpperCase()}</h1>
            <p className="text-sm text-slate-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <div>
                <p className="text-sm text-slate-500 uppercase tracking-wider font-bold">Total Amount</p>
                <p className="text-2xl font-serif font-bold text-indigo-600">₹{formatMoney(order.totalAmount)}</p>
            </div>
            
            <div className="flex gap-2">
                {order.status === 'pending' && (
                    <button 
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="text-sm bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                        {cancelling ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                )}

                <button 
                    onClick={downloadInvoice}
                    disabled={downloading}
                    className="text-sm bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {downloading ? 'Downloading...' : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Invoice
                        </>
                    )}
                </button>
            </div>
          </div>
        </div>

        {/* TRACKER */}
        <div className="px-8 py-8">
            {isCancelled ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center font-bold border border-red-100 flex items-center justify-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                This order has been Cancelled.
            </div>
            ) : (
            <div className="relative flex justify-between items-center mb-4 max-w-3xl mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 rounded-full" />
                <div className="absolute top-1/2 left-0 h-1 bg-indigo-500 -z-10 rounded-full transition-all duration-700" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
                {steps.map((step, idx) => {
                const completed = idx <= currentStep;
                return (
                    <div key={step} className="flex flex-col items-center bg-white px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${completed ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border-slate-200 text-slate-300'}`}>
                        {completed ? (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>) : (<span className="text-xs font-bold">{idx + 1}</span>)}
                    </div>
                    <span className={`text-xs mt-3 uppercase tracking-wider font-bold ${completed ? 'text-slate-800' : 'text-slate-300'}`}>{step}</span>
                    </div>
                );
                })}
            </div>
            )}
        </div>

        <div className="h-px bg-slate-100 w-full"></div>

        <div className="p-8 grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-8">
            <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-xl shadow-sm">📖</div>
                            <div>
                                <p className="font-bold text-slate-800">{item.title}</p>
                                <p className="text-sm text-slate-500">Qty: {item.qty} × ₹{formatMoney(item.price)}</p>
                            </div>
                        </div>
                        <span className="font-bold text-slate-900">₹{formatMoney(item.price * item.qty)}</span>
                    </div>
                ))}
                </div>
            </div>

            <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 mb-4">Payment Summary</h3>
                <div className="bg-slate-50 p-6 rounded-xl space-y-3">
                    <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{formatMoney(order.subtotal)}</span></div>
                    {order.discount > 0 && (<div className="flex justify-between text-emerald-600 font-medium"><span>Discount Applied</span><span>- ₹{formatMoney(order.discount)}</span></div>)}
                    <div className="h-px bg-slate-200 my-2"></div>
                    <div className="flex justify-between text-slate-900 font-bold text-lg"><span>Grand Total</span><span>₹{formatMoney(order.totalAmount)}</span></div>
                </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 mb-4">Shipping Details</h3>
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{order.shippingAddress}</p>
                </div>
            </div>
            <div>
                <h3 className="font-serif text-lg font-bold text-slate-900 mb-4">Payment Info</h3>
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">Payment ID</p>
                    <p className="text-xs font-mono bg-slate-100 p-2 rounded text-slate-700 break-all">{order.paymentId || 'N/A'}</p>
                    {isCancelled ? (
                       <div className="mt-4 flex items-center gap-2 text-red-600 text-sm font-bold">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                         Cancelled
                       </div>
                    ) : (
                       <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-bold">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                         Payment Successful
                       </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}