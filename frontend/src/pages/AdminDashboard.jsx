import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { getUser } from '../utils/auth';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis, CartesianGrid } from 'recharts';
import { ArrowRight, Package, ShoppingBag, AlertCircle, TrendingUp } from 'lucide-react'; // Assuming you might have lucide-react, if not replaced with emoji/text below

export default function AdminDashboard(){
  const [stats, setStats] = useState(null);
  const user = getUser();
  const nav = useNavigate();

  useEffect(()=>{
    if(!user || user.role !== 'admin'){ nav('/'); return; }
    api.get('/admin/dashboard').then(r => setStats(r.data)).catch(console.error);
  }, [user, nav]);

  if(!stats) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="loader"></div>
    </div>
  );

  // Prepare data for the chart (Top 5 Books)
  const chartData = stats.bestSellers.slice(0, 5).map(b => ({
    name: b.title.length > 20 ? b.title.slice(0, 20) + '...' : b.title,
    sales: b.soldCount,
    fullTitle: b.title
  }));

  const colors = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4 sm:px-6">
      
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-2 font-medium">Welcome back, <span className="text-indigo-600">{user.name}</span>. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <Link to="/admin/books" className="flex-1 md:flex-none text-center px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
             Manage Inventory
           </Link>
           <Link to="/admin/orders" className="flex-1 md:flex-none text-center px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
             View Orders
           </Link>
        </div>
      </div>

      {/* --- KPI Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats.totalSales.toLocaleString()}`} 
          icon="💰" 
          color="from-indigo-500 to-purple-600" 
          trend="+12% from last month"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon="📦" 
          color="from-emerald-500 to-teal-600" 
          trend="+5 new today"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={stats.lowStock.length} 
          icon="⚠️" 
          color="from-amber-500 to-orange-600" 
          alert={stats.lowStock.length > 0}
          trend={stats.lowStock.length > 0 ? "Action needed" : "Inventory healthy"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN (Main Stats) --- */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* Chart Section */}
           <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-lg md:text-xl font-bold text-slate-800">Top Performing Books</h3>
                 <select className="text-sm border-none bg-slate-50 rounded-lg px-3 py-1 text-slate-500 focus:ring-0 cursor-pointer hover:text-indigo-600">
                    <option>This Month</option>
                 </select>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} 
                        axisLine={false} 
                        tickLine={false} 
                        interval={0}
                        dy={10}
                    />
                    <YAxis 
                        tick={{fontSize: 11, fill: '#64748b'}} 
                        axisLine={false} 
                        tickLine={false}
                    />
                    <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                                <p className="text-xs text-slate-500 font-medium mb-1">{payload[0].payload.fullTitle}</p>
                                <p className="text-lg font-bold text-indigo-600">{payload[0].value} <span className="text-xs text-slate-400 font-normal">sold</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                    />
                    <Bar dataKey="sales" radius={[6, 6, 6, 6]} barSize={40} animationDuration={1500}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Best Sellers List */}
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">Best Sellers</h3>
                <Link to="/admin/reports" className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1">
                  View full report <span>&rarr;</span>
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.bestSellers.map((b, i) => (
                  <div key={b._id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${i < 3 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
                        {i+1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors line-clamp-1">{b.title}</p>
                        <p className="text-xs text-slate-500 font-medium">{b.author}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-lg">{b.soldCount}</p>
                      <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Units</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* --- RIGHT COLUMN (Widgets) --- */}
        <div className="space-y-8">
           
           {/* Low Stock Widget */}
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[450px]">
              <div className="p-5 bg-gradient-to-r from-red-50 to-white border-b border-red-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Low Stock
                </h3>
                <span className="text-xs font-bold bg-white text-red-600 px-2.5 py-1 rounded-md shadow-sm border border-red-100">{stats.lowStock.length} items</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {stats.lowStock.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <span className="text-5xl mb-4 opacity-50">🛡️</span>
                    <p className="text-sm font-medium">Inventory is healthy</p>
                  </div>
                ) : (
                  stats.lowStock.map(b => (
                    <div key={b._id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-red-200 hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight mr-2" title={b.title}>{b.title}</p>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-lg whitespace-nowrap">
                          {b.stock} left
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                         <span className="text-xs text-slate-500 font-medium">₹{b.price}</span>
                         <Link to={`/admin/books`} className="text-[10px] font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">
                            RESTOCK
                         </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </div>

           {/* Quick Actions Grid */}
           <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 text-white relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 blur-3xl opacity-20 rounded-full pointer-events-none"></div>
              
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2 relative z-10">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3 relative z-10">
                <QuickAction to="/admin/books" icon="📚" label="Add Book" />
                <QuickAction to="/admin/promotions" icon="🎟️" label="Promotions" />
                <QuickAction to="/admin/orders" icon="📦" label="Orders" />
                <QuickAction to="/admin/reports" icon="📊" label="Analytics" />
                <QuickAction to="/admin/logs" icon="🛡️" label="Audit Logs" />
                <QuickAction to="/admin/users" icon="👥" label="Users" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, alert, trend }) {
  return (
    <div className={`relative overflow-hidden bg-white p-6 rounded-3xl shadow-sm border transition-all hover:-translate-y-1 hover:shadow-lg ${alert ? 'border-red-200 ring-4 ring-red-50/50' : 'border-slate-100'}`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-10 blur-2xl`}></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-xl shadow-md shadow-indigo-100 text-white`}>
                {icon}
            </div>
            {trend && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${alert ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label }) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm group">
      <span className="text-2xl mb-2 group-hover:-translate-y-1 transition-transform duration-300">{icon}</span>
      <span className="text-xs font-bold text-slate-300 group-hover:text-white">{label}</span>
    </Link>
  );
}