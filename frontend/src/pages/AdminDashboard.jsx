// src/Pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { getUser } from '../utils/auth';
import { Link, useNavigate } from 'react-router-dom';


export default function AdminDashboard(){
  const [stats, setStats] = useState(null);
  const user = getUser();
  const nav = useNavigate();

  useEffect(()=>{
    // guard: if no user or not admin, redirect once and stop
    if(!user){ nav('/'); return; }
    if(user.role !== 'admin'){ nav('/'); return; }

    let mounted = true;
    api.get('/admin/dashboard')
      .then(r => { if(mounted) setStats(r.data); })
      .catch(()=> {});
    return () => { mounted = false; };
  }, [user, nav]);

  if(!stats) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
      {/* stats UI same as before */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Sales</div>
          <div className="text-2xl font-bold">₹{stats.totalSales}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Low stock items</div>
          <div className="text-2xl font-bold">{stats.lowStock.length}</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Best sellers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.bestSellers.map(b => (
            <div key={b._id} className="bg-white p-3 rounded shadow">
              <div className="font-semibold">{b.title}</div>
              <div className="text-sm">{b.author}</div>
              <div className="text-sm font-bold mt-2">Sold: {b.soldCount}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/admin/books" className="px-3 py-2 bg-gray-100 rounded">Manage books</Link>
        <Link to="/admin/promotions" className="px-3 py-2 bg-gray-100 rounded">Promotions</Link>
        <Link to="/admin/reports" className="px-3 py-2 bg-gray-100 rounded">Reports</Link>
        <Link to="/admin/orders" className="px-3 py-2 bg-gray-100 rounded">Orders</Link>
      </div>
    </div>
  );
}
