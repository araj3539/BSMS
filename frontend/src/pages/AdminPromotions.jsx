// src/pages/AdminPromotions.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPromotions(){
  const [promos, setPromos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  
  const [form, setForm] = useState({ name:'', code:'', type:'percent', value:0, active:true, minOrderValue:0, expiresAt:'' });

  useEffect(()=> { fetchPromos(); }, []);

  async function fetchPromos(){
    try{ const r = await api.get('/promotions'); setPromos(r.data); }catch(e){}
  }

  function closeModal() {
    setEditing(null);
    setCreating(false);
    setForm({ name:'', code:'', type:'percent', value:0, active:true, minOrderValue:0, expiresAt:''});
  }

  function change(e){
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : (name==='value' || name==='minOrderValue' ? Number(value) : value) }));
  }

  async function save(){
    if(!form.name || !form.code || !form.value) return toast.error("Fill required fields");
    try{
      if(editing) await api.put('/promotions/' + editing._id, form);
      else await api.post('/promotions', form);
      toast.success(editing ? "Updated" : "Created");
      closeModal();
      fetchPromos();
    }catch(err){ toast.error(err.response?.data?.msg || 'Error'); }
  }

  async function remove(id){
    if(!confirm('Delete?')) return;
    try { await api.delete('/promotions/' + id); toast.success("Deleted"); fetchPromos(); } catch(e) { toast.error("Failed"); }
  }

  function openEdit(p){
    setEditing(p);
    setForm({
      name: p.name, code: p.code, type: p.type, value: p.value, active: p.active, minOrderValue: p.minOrderValue || 0,
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().slice(0,16) : ''
    });
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Promotions</h2>
            <p className="text-slate-500 font-medium mt-1 text-sm">Manage discount codes</p>
        </div>
        <button onClick={()=> { closeModal(); setCreating(true); }} className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
            + New Promo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <AnimatePresence>
        {promos.map(p => (
          <motion.div 
            key={p._id} 
            layout 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`group relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${p.active ? 'border-slate-100' : 'border-slate-100 opacity-60 grayscale'}`}
          >
            {/* Visual Header */}
            <div className={`h-2 w-full ${p.active ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-slate-300'}`}></div>
            
            <div className="p-5 md:p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1 font-mono font-bold text-slate-700 text-base md:text-lg tracking-widest uppercase truncate max-w-[70%]">
                        {p.code}
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {p.active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                
                <h3 className="font-bold text-slate-900 text-base md:text-lg mb-1 truncate">{p.name}</h3>
                <div className="text-2xl md:text-3xl font-bold text-indigo-600 tracking-tight mb-4">
                    {p.type === 'percent' ? `${p.value}%` : `₹${p.value}`} <span className="text-base text-slate-400 font-medium">OFF</span>
                </div>

                <div className="space-y-1 text-xs text-slate-500 font-medium border-t border-slate-50 pt-4 mb-4">
                    <div className="flex justify-between"><span>Min Order:</span> <span className="text-slate-800">₹{p.minOrderValue}</span></div>
                    {p.expiresAt && <div className="flex justify-between"><span>Expires:</span> <span className="text-slate-800">{new Date(p.expiresAt).toLocaleDateString()}</span></div>}
                </div>

                <div className="flex gap-2">
                    <button onClick={()=> openEdit(p)} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-white hover:shadow-sm hover:text-indigo-600 border border-transparent hover:border-slate-200 transition-all">Edit</button>
                    <button onClick={()=> remove(p._id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all">Delete</button>
                </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      {/* --- Modal --- */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="font-serif font-bold text-xl md:text-2xl text-slate-900 mb-6">{editing ? 'Edit Promotion' : 'Create Promotion'}</h3>
            
            <div className="space-y-5">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Internal Name</label>
                    <input name="name" value={form.name} onChange={change} placeholder="e.g. Summer Sale" className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Code</label>
                        <input name="code" value={form.code} onChange={change} placeholder="SUMMER20" className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Type</label>
                        <select name="type" value={form.type} onChange={change} className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                            <option value="percent">Percent (%)</option>
                            <option value="flat">Flat (₹)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Value</label>
                        <input name="value" type="number" value={form.value} onChange={change} className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Min Order (₹)</label>
                        <input name="minOrderValue" type="number" value={form.minOrderValue} onChange={change} className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Expiration (Optional)</label>
                    <input name="expiresAt" type="datetime-local" value={form.expiresAt} onChange={change} className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600" />
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <input type="checkbox" id="active" name="active" checked={form.active} onChange={change} className="w-5 h-5 accent-indigo-600" />
                    <label htmlFor="active" className="text-sm font-bold text-slate-700">Activate Immediately</label>
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
                <button onClick={closeModal} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                <button onClick={save} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}