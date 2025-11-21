// src/Pages/AdminPromotions.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminPromotions(){
  const [promos, setPromos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name:'', code:'', type:'percent', value:0, active:true, minOrderValue:0, expiresAt:''
  });

  useEffect(()=> { fetchPromos(); }, []);

  async function fetchPromos(){
    try{ const r = await api.get('/promotions'); setPromos(r.data); }catch(e){}
  }

  function change(e){
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : (name==='value' || name==='minOrderValue' ? Number(value) : value) }));
  }

  async function save(){
    try{
      if(editing){
        await api.put('/promotions/' + editing._id, form);
        setEditing(null);
      } else {
        await api.post('/promotions', form);
      }
      setForm({ name:'', code:'', type:'percent', value:0, active:true, minOrderValue:0, expiresAt:''});
      fetchPromos();
    }catch(err){ alert(err.response?.data?.msg || 'Error'); }
  }

  async function remove(id){
    if(!confirm('Delete promotion?')) return;
    await api.delete('/promotions/' + id);
    fetchPromos();
  }

  function edit(p){
    setEditing(p);
    setForm({
      name: p.name, code: p.code, type: p.type, value: p.value, active: p.active, minOrderValue: p.minOrderValue || 0,
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().slice(0,16) : ''
    });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Promotions</h2>

      <div className="bg-white p-4 rounded mb-6">
        <h4 className="font-semibold mb-2">{editing ? 'Edit promotion' : 'Create promotion'}</h4>
        <div className="grid md:grid-cols-2 gap-3">
          <input name="name" value={form.name} onChange={change} placeholder="Name" className="border p-2 rounded" />
          <input name="code" value={form.code} onChange={change} placeholder="Code (e.g. SAVE10)" className="border p-2 rounded" />
          <select name="type" value={form.type} onChange={change} className="border p-2 rounded">
            <option value="percent">Percent (%)</option>
            <option value="flat">Flat (₹)</option>
          </select>
          <input name="value" value={form.value} onChange={change} type="number" placeholder="Value" className="border p-2 rounded" />
          <input name="minOrderValue" value={form.minOrderValue} onChange={change} type="number" placeholder="Min order value" className="border p-2 rounded" />
          <input name="expiresAt" value={form.expiresAt} onChange={change} type="datetime-local" placeholder="Expires at" className="border p-2 rounded" />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="active" checked={form.active} onChange={change} />
            Active
          </label>
        </div>
        <div className="mt-3">
          <button onClick={save} className="px-3 py-1 bg-blue-600 text-white rounded">{editing ? 'Update' : 'Create'}</button>
          {editing && <button onClick={()=> { setEditing(null); setForm({ name:'', code:'', type:'percent', value:0, active:true, minOrderValue:0, expiresAt:'' }); }} className="ml-2">Cancel</button>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {promos.map(p => (
          <div key={p._id} className="bg-white p-3 rounded shadow">
            <div className="font-semibold">{p.name} <span className="text-xs text-gray-500">({p.code})</span></div>
            <div className="text-sm mt-1">{p.type === 'percent' ? `${p.value}% off` : `₹${p.value} off` }</div>
            <div className="text-xs text-gray-500 mt-1">Min: ₹{p.minOrderValue} {p.expiresAt && <> • Expires: {new Date(p.expiresAt).toLocaleString()}</>}</div>
            <div className="mt-3 flex gap-2">
              <button onClick={()=> edit(p)} className="px-2 py-1 bg-yellow-400 rounded">Edit</button>
              <button onClick={()=> remove(p._id)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
