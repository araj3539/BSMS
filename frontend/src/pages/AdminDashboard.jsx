import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { getUser } from '../utils/auth';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminDashboard(){
  const [stats, setStats] = useState(null);
  const user = getUser();
  const nav = useNavigate();

  useEffect(()=>{
    if(!user || user.role !== 'admin'){ nav('/'); return; }
    api.get('/admin/dashboard').then(r => setStats(r.data)).catch(console.error);
  }, [user, nav]);

  if(!stats) return <div className="flex justify-center p-20"><div className="loader"></div></div>;

  // Prepare data for the chart (Top 5 Books)
  const chartData = stats.bestSellers.slice(0, 5).map(b => ({
    name: b.title.length > 15 ? b.title.slice(0, 15) + '...' : b.title,
    sales: b.soldCount
  }));

  const colors = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2 font-medium">Welcome back, {user.name}.</p>
        </div>
        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
           <Link to="/admin/books" className="flex-1 md:flex-none text-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-xs md:text-sm hover:bg-slate-50 hover:shadow-sm transition-all">
             Inventory
           </Link>
           <Link to="/admin/orders" className="flex-1 md:flex-none text-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs md:text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
             Orders
           </Link>
        </div>
      </div>

      {/* --- KPI Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats.totalSales.toLocaleString()}`} 
          icon="💰" 
          color="from-indigo-500 to-purple-600" 
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon="📦" 
          color="from-emerald-500 to-teal-600" 
        />
        <StatCard 
          title="Low Stock" 
          value={stats.lowStock.length} 
          icon="⚠️" 
          color="from-amber-500 to-orange-600" 
          alert={stats.lowStock.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* --- LEFT COLUMN (Main Stats) --- */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
           
           {/* Chart Section */}
           <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6">Top Performing Books</h3>
              <div className="h-56 md:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis 
                        dataKey="name" 
                        tick={{fontSize: 10, fill: '#64748b'}} 
                        axisLine={false} 
                        tickLine={false} 
                        interval={0}
                        dy={10}
                    />
                    <Tooltip 
                        cursor={{fill: '#f8fafc', radius: 4}} 
                        contentStyle={{borderRadius: '12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)', padding:'12px'}} 
                    />
                    <Bar dataKey="sales" radius={[6, 6, 6, 6]} barSize={30}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Best Sellers List */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-base md:text-lg font-bold text-slate-800">Best Sellers</h3>
                <Link to="/admin/reports" className="text-xs md:text-sm text-indigo-600 font-semibold hover:text-indigo-700">See Reports &rarr;</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.bestSellers.map((b, i) => (
                  <div key={b._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${i < 3 ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-50' : 'bg-slate-100 text-slate-500'}`}>
                        {i+1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm md:text-base group-hover:text-indigo-600 transition-colors line-clamp-1">{b.title}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-medium">{b.author}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm md:text-lg">{b.soldCount}</p>
                      <p className="text-[8px] md:text-[10px] uppercase text-slate-400 font-bold tracking-wider">Sold</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* --- RIGHT COLUMN (Widgets) --- */}
        <div className="space-y-6 md:space-y-8">
           
           {/* Low Stock Widget */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[300px] md:h-[400px]">
              <div className="p-4 md:p-5 bg-red-50/80 border-b border-red-100 flex justify-between items-center">
                <h3 className="text-xs md:text-sm font-bold text-red-800 uppercase tracking-wide flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  Low Stock
                </h3>
                <span className="text-xs font-bold bg-white text-red-600 px-2 py-1 rounded shadow-sm border border-red-100">{stats.lowStock.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {stats.lowStock.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <span className="text-3xl md:text-4xl mb-2">✅</span>
                    <p className="text-xs md:text-sm">Inventory healthy</p>
                  </div>
                ) : (
                  stats.lowStock.map(b => (
                    <div key={b._id} className="p-3 rounded-xl bg-white border border-slate-100 hover:border-red-200 hover:shadow-sm transition-all group">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs md:text-sm font-semibold text-slate-800 line-clamp-1 mr-2" title={b.title}>{b.title}</p>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md whitespace-nowrap">
                          {b.stock} left
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                         <span className="text-[10px] md:text-xs text-slate-500">Price: ₹{b.price}</span>
                         <Link to={`/admin/books`} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                            RESTOCK
                         </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </div>

           {/* Quick Actions Grid */}
           <div className="bg-slate-900 p-4 md:p-6 rounded-2xl shadow-xl shadow-slate-200 text-white">
              <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction to="/admin/books" icon="📚" label="Add Book" />
                <QuickAction to="/admin/promotions" icon="🎟️" label="Promotions" />
                <QuickAction to="/admin/orders" icon="📦" label="Orders" />
                <QuickAction to="/admin/reports" icon="📊" label="Analytics" />
                <QuickAction to="/admin/logs" icon="🛡️" label="Audit Logs" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, alert }) {
  return (
    <div className={`relative overflow-hidden bg-white p-5 rounded-2xl shadow-sm border transition-all hover:-translate-y-1 hover:shadow-lg ${alert ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-100'}`}>
      <div className={`absolute -right-6 -top-6 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${color} opacity-10 blur-xl`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-base md:text-xl shadow-sm text-white`}>
            {icon}
          </div>
          <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">{title}</p>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label }) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm">
      <span className="text-xl md:text-2xl mb-1">{icon}</span>
      <span className="text-[10px] md:text-xs font-bold text-slate-200">{label}</span>
    </Link>
  );
}