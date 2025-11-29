// src/Pages/AdminPromotions.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function AdminPromotions(){
  const [promos, setPromos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  
  const [form, setForm] = useState({
    name:'', code:'', type:'percent', value:0, active:true, minOrderValue:0, expiresAt:''
  });

  useEffect(()=> { 
    fetchPromos(); 
    
    // Close on Escape
    const handleEsc = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  async function fetchPromos(){
    try{ const r = await api.get('/promotions'); setPromos(r.data); }catch(e){}
  }

  function closeModal() {
    setEditing(null);
    setCreating(false);
    resetForm();
  }

  function resetForm() {
    setForm({ name:'', code:'', type:'percent', value:0, active:true, minOrderValue:0, expiresAt:''});
  }

  function change(e){
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : (name==='value' || name==='minOrderValue' ? Number(value) : value) }));
  }

  async function save(){
    if(!form.name || !form.code || !form.value) return toast.error("Please fill required fields");
    try{
      if(editing){
        await api.put('/promotions/' + editing._id, form);
        toast.success("Promotion updated");
      } else {
        await api.post('/promotions', form);
        toast.success("Promotion created");
      }
      closeModal();
      fetchPromos();
    }catch(err){ toast.error(err.response?.data?.msg || 'Error'); }
  }

  async function remove(id){
    if(!confirm('Delete promotion?')) return;
    try {
        await api.delete('/promotions/' + id);
        toast.success("Deleted");
        fetchPromos();
    } catch(e) { toast.error("Failed to delete"); }
  }

  function openEdit(p){
    setEditing(p);
    setForm({
      name: p.name, code: p.code, type: p.type, value: p.value, active: p.active, minOrderValue: p.minOrderValue || 0,
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().slice(0,16) : ''
    });
  }

  const isModalOpen = creating || editing;

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">Promotions</h2>
            <p className="text-slate-500 text-sm mt-1">Manage discount codes and coupons.</p>
        </div>
        <button 
            onClick={()=> { resetForm(); setCreating(true); }} 
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all font-medium text-sm shadow-lg shadow-slate-200 flex items-center gap-2"
        >
            <span className="text-lg">+</span> Create Promo
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {promos.map(p => (
          <div key={p._id} className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150 ${p.active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            
            <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="font-mono font-bold text-lg text-slate-800 tracking-wider bg-slate-100 px-2 py-1 rounded">{p.code}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {p.active ? 'Active' : 'Inactive'}
                </span>
            </div>
            
            <h3 className="font-bold text-slate-900 mb-1">{p.name}</h3>
            <div className="text-indigo-600 font-bold text-xl mb-4">
                {p.type === 'percent' ? `${p.value}% OFF` : `₹${p.value} OFF` }
            </div>

            <div className="text-xs text-slate-500 space-y-1 mb-6">
                <p>Min Order: <span className="font-medium text-slate-700">₹{p.minOrderValue}</span></p>
                {p.expiresAt && <p>Expires: <span className="font-medium text-slate-700">{new Date(p.expiresAt).toLocaleDateString()}</span></p>}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
              <button onClick={()=> openEdit(p)} className="py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:border-indigo-500 hover:text-indigo-600 transition-colors">Edit</button>
              <button onClick={()=> remove(p._id)} className="py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:border-red-500 hover:text-red-600 transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL POPUP --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
          
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-popIn flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
              <h3 className="text-xl font-serif font-bold text-slate-900">{editing ? 'Edit Promotion' : 'New Promotion'}</h3>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>

            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Promo Name</label>
                    <input name="name" value={form.name} onChange={change} placeholder="e.g. Summer Sale" className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Code</label>
                        <input name="code" value={form.code} onChange={change} placeholder="e.g. SUM25" className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 uppercase" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Discount Type</label>
                        <select name="type" value={form.type} onChange={change} className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white">
                            <option value="percent">Percentage (%)</option>
                            <option value="flat">Flat Amount (₹)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Value</label>
                        <input name="value" value={form.value} onChange={change} type="number" className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Min Order (₹)</label>
                        <input name="minOrderValue" value={form.minOrderValue} onChange={change} type="number" className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-indigo-500" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Expiration Date</label>
                    <input name="expiresAt" value={form.expiresAt} onChange={change} type="datetime-local" className="w-full border border-slate-200 p-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 text-slate-600" />
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <input type="checkbox" id="active" name="active" checked={form.active} onChange={change} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
                    <label htmlFor="active" className="text-sm font-medium text-slate-700">Activate this promotion immediately</label>
                </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
                <button onClick={save} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md transition-all">
                    {editing ? 'Save Changes' : 'Create Promotion'}
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